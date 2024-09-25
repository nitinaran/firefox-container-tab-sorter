let sortingTimeout = null;
let isSorting = false;
let sortScheduled = false;

browser.tabs.onCreated.addListener((tab) => {
	if (
		!tab.url.startsWith("moz-extension://") &&
		!tab.url.startsWith("about:")
	) {
		scheduleSorting();
	}
});

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (
		changeInfo.url &&
		!tab.url.startsWith("moz-extension://") &&
		!tab.url.startsWith("about:")
	) {
		scheduleSorting();
	}
});

browser.runtime.onMessage.addListener((message) => {
	if (message.action === "sortTabs") {
		sortTabs();
	}
});

// Listen for container changes
browser.contextualIdentities.onCreated.addListener(() => scheduleSorting());
browser.contextualIdentities.onUpdated.addListener(() => scheduleSorting());
browser.contextualIdentities.onRemoved.addListener(() => scheduleSorting());

// Listen for preference changes
browser.storage.onChanged.addListener((changes, areaName) => {
	if (areaName === "local") {
		if (
			Object.prototype.hasOwnProperty.call(changes, "containerOrder") ||
			Object.prototype.hasOwnProperty.call(changes, "sortTabsInGroup") ||
			Object.prototype.hasOwnProperty.call(changes, "tabSortCriteria")
		) {
			scheduleSorting();
		}
	}
});

function scheduleSorting() {
	if (isSorting || sortScheduled) return; // Prevent scheduling if sorting is already in progress or scheduled
	sortScheduled = true;
	if (sortingTimeout) {
		clearTimeout(sortingTimeout);
	}
	sortingTimeout = setTimeout(() => {
		sortScheduled = false;
		sortTabs();
	}, 500);
}

async function sortTabs() {
	if (isSorting) return; // Prevent re-entrance
	isSorting = true;
	try {
		const tabs = await browser.tabs.query({ currentWindow: true });

		// Exclude extension and special tabs
		const filteredTabs = tabs.filter(
			(tab) =>
				!tab.url.startsWith("moz-extension://") &&
				!tab.url.startsWith("about:"),
		);

		const containers = await browser.contextualIdentities.query({});
		const containerMap = containers.reduce((map, container) => {
			map[container.cookieStoreId] = container;
			return map;
		}, {});

		// Load user preferences
		const prefs = await browser.storage.local.get({
			containerOrder: [],
			sortTabsInGroup: false,
			tabSortCriteria: "domain", // Can be 'title', 'url', or 'domain'
		});

		// Map container IDs to their desired order
		const containerOrderMap = {};
		prefs.containerOrder.forEach((id, index) => {
			containerOrderMap[id] = index;
		});

		// If no container order is set, use the order in which they were created
		if (prefs.containerOrder.length === 0) {
			prefs.containerOrder = containers.map((c) => c.cookieStoreId);
		}

		// Separate pinned and unpinned tabs from the filtered list
		const pinnedTabs = filteredTabs.filter((tab) => tab.pinned);
		const unpinnedTabs = filteredTabs.filter((tab) => !tab.pinned);

		const tabsWithContainers = unpinnedTabs.map((tab) => {
			const container = containerMap[tab.cookieStoreId];
			return {
				...tab,
				containerName: container ? container.name.toLowerCase() : null,
				containerOrder: container
					? containerOrderMap[container.cookieStoreId]
					: Number.POSITIVE_INFINITY,
			};
		});
		const sortedTabs = tabsWithContainers.sort((a, b) => {
			// Tabs without containers should always be at the end
			if (!a.containerName && b.containerName) return 1;
			if (a.containerName && !b.containerName) return -1;
			if (!a.containerName && !b.containerName) return a.index - b.index;

			// Sort by container order
			if (a.containerOrder !== b.containerOrder) {
				return a.containerOrder - b.containerOrder;
			}

			// If containers are the same, optionally sort tabs within the group
			if (prefs.sortTabsInGroup) {
				let aValue = "";
				let bValue = "";

				if (prefs.tabSortCriteria === "title") {
					aValue = (a.title || "").toLowerCase();
					bValue = (b.title || "").toLowerCase();
				} else if (prefs.tabSortCriteria === "url") {
					aValue = (a.url || "").toLowerCase();
					bValue = (b.url || "").toLowerCase();
				} else if (prefs.tabSortCriteria === "domain") {
					aValue = getDomain(a.url);
					bValue = getDomain(b.url);
				}

				return aValue.localeCompare(bValue);
			}

			// If sorting within groups is disabled or criteria are equal, maintain original order
			return a.index - b.index;
		});

		// Move unpinned tabs to start after pinned tabs
		const tabIds = sortedTabs.map((tab) => tab.id);
		await browser.tabs.move(tabIds, { index: pinnedTabs.length });
	} catch (error) {
		console.error("Error sorting tabs in sortTabs():", error);
	} finally {
		isSorting = false;
	}
}

function getDomain(url) {
	try {
		const urlObject = new URL(url);
		return urlObject.hostname;
	} catch (e) {
		console.error("Error parsing URL:", e);
		return url;
	}
}
