# Container Tab Sorter

## Overview
Container Tab Sorter is a Firefox extension that automatically sorts your tabs based on their container assignments. It works in conjunction with the Firefox Multi-Account Containers extension to provide a seamless tab organization experience.

## Features
- Automatically sorts tabs based on their container assignments
- Keeps tabs without container assignments at the end of the tab bar
- Maintains the original order of tabs within each container group
- Works in real-time, sorting tabs as they are created or updated

## Requirements
- Firefox browser
- [Firefox Multi-Account Containers](https://addons.mozilla.org/en-US/firefox/addon/multi-account-containers/) extension

## Installation
1. Install the Container Tab Sorter extension from the Firefox Add-ons store.
2. Ensure you have the Firefox Multi-Account Containers extension installed and active.

## Usage
Once installed, Container Tab Sorter works automatically in the background. You don't need to interact with it directly. Here's what it does:

1. When you open a new tab or update an existing one, the extension checks its container assignment.
2. It then sorts all tabs in the current window based on their container assignments.
3. Tabs are grouped by their containers, with tabs in the same container staying together.
4. Tabs without container assignments are always moved to the end of the tab bar.
5. Within each container group and among non-container tabs, the original tab order is maintained.

## How Pinned Tabs Are Handled

Pinned tabs are kept at the beginning of the tab bar and are not moved or sorted by the extension. Only unpinned tabs are sorted based on their container assignments and your sorting preferences.

## Privacy and Permissions
This extension requires the following permissions:
- `tabs`: To access and manipulate tab information and positions.
- `contextualIdentities`: To interact with container information.
- `storage`: To save and retrieve user preferences.

Container Tab Sorter does not collect or transmit any user data. It only reads tab and container information locally to perform its sorting function.

## Support
If you encounter any issues or have suggestions for improvements, please file an issue on our GitHub repository or contact us through the Firefox Add-ons store.

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## License
[MIT License](LICENSE)

## Acknowledgements
This extension works in conjunction with the Firefox Multi-Account Containers extension. We are grateful to Mozilla and the Multi-Account Containers team for their excellent work.