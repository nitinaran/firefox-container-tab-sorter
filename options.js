document.addEventListener("DOMContentLoaded", restoreOptions);

const containerList = document.getElementById("containerList");
const sortTabsInGroupCheckbox = document.getElementById("sortTabsInGroup");
const saveButton = document.getElementById("saveButton");

// Get references to the radio buttons
const sortByTitleRadio = document.getElementById("sortByTitle");
const sortByURLRadio = document.getElementById("sortByURL");
const sortByDomainRadio = document.getElementById("sortByDomain");

const arrowUp = '<svg class="arrow-icon"><use xlink:href="#arrow-up"/></svg>';
const arrowDown =
	'<svg class="arrow-icon"><use xlink:href="#arrow-down"/></svg>';

async function restoreOptions() {
	// Load saved options
	const prefs = await browser.storage.local.get({
		containerOrder: [],
		sortTabsInGroup: false,
		tabSortCriteria: "domain",
	});

	// Fetch all containers
	const containers = await browser.contextualIdentities.query({});

	// If no container order saved, default to current order
	if (prefs.containerOrder.length === 0) {
		prefs.containerOrder = containers.map((c) => c.cookieStoreId);
	}

	// Sort containers based on saved order
	containers.sort((a, b) => {
		return (
			prefs.containerOrder.indexOf(a.cookieStoreId) -
			prefs.containerOrder.indexOf(b.cookieStoreId)
		);
	});

	// Build the container list
	containerList.innerHTML = containers
		.map(
			(container, index) => `
        <li class="bg-gray-200 p-3 rounded-md flex items-center justify-between mb-2" data-id="${container.cookieStoreId}">
          <div class="flex items-center space-x-2">
            <span class="w-4 h-4 rounded-full" style="background-color: ${container.colorCode};"></span>
            <span>${container.name}</span>
          </div>
          <div class="space-x-2">
            <button class="move-up text-gray-600 hover:text-gray-800 ${index === 0 ? "hidden" : ""}">${arrowUp}</button>
            <button class="move-down text-gray-600 hover:text-gray-800 ${index === containers.length - 1 ? "hidden" : ""}">${arrowDown}</button>
          </div>
        </li>
      `,
		)
		.join("");

	// Set tab sorting options
	sortTabsInGroupCheckbox.checked = prefs.sortTabsInGroup;

	// Set the radio button based on the saved preference
	if (prefs.tabSortCriteria === "title") {
		sortByTitleRadio.checked = true;
	} else if (prefs.tabSortCriteria === "url") {
		sortByURLRadio.checked = true;
	} else if (prefs.tabSortCriteria === "domain") {
		sortByDomainRadio.checked = true;
	}

	// Add event listeners for move up/down buttons
	containerList.addEventListener("click", handleContainerMove);
}

function handleContainerMove(event) {
	const button = event.target.closest("button");
	if (!button) return;

	const li = button.closest("li");
	const isMovingUp = button.classList.contains("move-up");
	const siblingLi = isMovingUp
		? li.previousElementSibling
		: li.nextElementSibling;

	if (siblingLi) {
		// Disable buttons during animation
		disableButtons();

		// Add animation classes
		li.classList.add(isMovingUp ? "moving-up" : "moving-down");
		siblingLi.classList.add(isMovingUp ? "moving-down" : "moving-up");

		// Wait for animation to complete before updating DOM
		setTimeout(() => {
			// Remove animation classes
			li.classList.remove("moving-up", "moving-down");
			siblingLi.classList.remove("moving-up", "moving-down");

			// Update DOM
			if (isMovingUp) {
				containerList.insertBefore(li, siblingLi);
			} else {
				containerList.insertBefore(siblingLi, li);
			}

			updateMoveButtons();
			enableButtons();
		}, 150); // Match this with the animation duration in CSS
	}
}

function disableButtons() {
	const buttons = containerList.querySelectorAll("button");
	for (const button of buttons) {
		button.disabled = true;
	}
}

function enableButtons() {
	const buttons = containerList.querySelectorAll("button");
	for (const button of buttons) {
		button.disabled = false;
	}
}

function updateMoveButtons() {
	const items = containerList.querySelectorAll("li");
	items.forEach((item, index) => {
		const upButton = item.querySelector(".move-up");
		const downButton = item.querySelector(".move-down");

		upButton.classList.toggle("hidden", index === 0);
		downButton.classList.toggle("hidden", index === items.length - 1);
	});
}

saveButton.addEventListener("click", saveOptions);

async function saveOptions() {
	const containerOrder = Array.from(containerList.children).map(
		(li) => li.dataset.id,
	);

	// Determine which radio button is selected
	let tabSortCriteria = "domain";
	if (sortByURLRadio.checked) {
		tabSortCriteria = "url";
	} else if (sortByTitleRadio.checked) {
		tabSortCriteria = "title";
	}

	await browser.storage.local.set({
		containerOrder: containerOrder,
		sortTabsInGroup: sortTabsInGroupCheckbox.checked,
		tabSortCriteria: tabSortCriteria,
	});

	showMessage("Options saved!", "bg-green-500");
}

function showMessage(text, bgColor) {
	const message = document.createElement("div");
	message.textContent = text;
	message.className = `fixed bottom-4 right-4 ${bgColor} text-white px-4 py-2 rounded-md shadow-lg`;
	document.body.appendChild(message);

	setTimeout(() => {
		message.remove();
	}, 3000);
}
