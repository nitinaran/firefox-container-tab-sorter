// background.js
browser.tabs.onCreated.addListener(sortTabs);
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    sortTabs();
  }
});

async function getContainerAssignment(url) {
  try {
    const assignment = await browser.runtime.sendMessage(
      "@testpilot-containers",
      {
        method: "getAssignment",
        url: url,
      }
    );
    return assignment ? assignment.userContextId : null;
  } catch (error) {
    console.error("Error getting container assignment:", error);
    return null;
  }
}

async function sortTabs() {
  try {
    const tabs = await browser.tabs.query({ currentWindow: true });
    const tabsWithAssignments = await Promise.all(
      tabs.map(async (tab) => {
        const assignment = await getContainerAssignment(tab.url);
        return { ...tab, assignment };
      })
    );

    const sortedTabs = tabsWithAssignments.sort((a, b) => {
      // If both tabs have no container, maintain their original order
      if (!a.assignment && !b.assignment) return a.index - b.index;

      // Tabs without containers should always be at the end
      if (!a.assignment) return 1;
      if (!b.assignment) return -1;

      // If both tabs have containers, sort by container ID
      if (a.assignment < b.assignment) return -1;
      if (a.assignment > b.assignment) return 1;

      // If containers are the same, maintain original order within the container
      return a.index - b.index;
    });

    for (let i = 0; i < sortedTabs.length; i++) {
      await browser.tabs.move(sortedTabs[i].id, { index: i });
    }
  } catch (error) {
    console.error("Error sorting tabs:", error);
  }
}
