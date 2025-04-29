# Frea Custom New Tab Page

A clean and highly customizable Chrome extension that replaces the default new tab page with quick links, bookmarks, search, and themes.

## Features

- **Quick Links**: Add and organize your favorite websites for one-click access.
- **Bookmarks**: Display Chrome bookmarks in a structured layout.
- **Search Bar**: Integrated search (Google by default) directly on the new tab.
- **Themes & Wallpapers**: Choose from built-in wallpapers or add your own.
- **Light & Dark Modes**: Automatic or manual toggle for theme styles.

## Installation

1. Clone or download this repository.
2. Open Chrome and go to `chrome://extensions`.
3. Enable **Developer mode** (toggle at top right).
4. Click **Load unpacked** and select the project folder.
5. A new tab will now use this extension.

## Usage

- Open a new tab to view your custom dashboard.
- Click **+** under Quick Links to add a new link.
- Use the gear icon to open settings for wallpapers and theme mode.

## Customization

- **Quick Links**: Stored in Chrome `storage.sync`. Open settings to edit or reorder.
- **Wallpapers**: Add image files to `wallpapers/` and update `newtab.js` if needed.
- **Search Engine**: Change the search URL in `newtab.js` (default: Google).
- **Styles**: Modify `styles.css` to adjust colors, fonts, and layout.

## File Structure

```
chrome-startup/
├── icons/              # Extension icons (PNG)
├── wallpapers/         # Default wallpapers
├── manifest.json       # Extension configuration (MV3)
├── newtab.html         # HTML template for new tab page
├── newtab.js           # Main JavaScript logic
├── styles.css          # Styling for the dashboard
├── README.md           # This documentation
```

## Development

- Uses vanilla JavaScript and CSS—no build step required.
- To test changes, reload the extension in `chrome://extensions`.
- Use the browser console for debugging (`F12`).

## Contributing

Contributions are welcome! Feel free to:

- Submit issues or feature requests.
- Open pull requests with improvements, bug fixes, or documentation updates.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
