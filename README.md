# Frea Custom New Tab Page

A clean and highly customizable Chrome extension that replaces the default new tab page with quick links, bookmarks, search, and themes.

![Frea Custom New Tab Page Screenshot](ss.png)

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Customization](#customization)
- [File Structure](#file-structure)
- [Development](#development)
- [Contributing](#contributing)
- [FAQs](#faqs)
- [License](#license)

---

## Features

- **Quick Links**: Add and organize your favorite websites for one-click access.
- **Bookmarks**: Display Chrome bookmarks in a structured layout.
- **Search Bar**: Integrated search (Google by default) directly on the new tab.
- **Themes & Wallpapers**: Choose from built-in wallpapers or add your own.
- **Light & Dark Modes**: Automatic or manual toggle for theme styles.
- **Modern Color Scheme**: Professional color palette with improved readability.
- **Gradient Background**: Dynamic color wheel gradient that transitions smoothly between multiple colors.

---

## Installation

1. Clone or download this repository.
2. Open Chrome and go to `chrome://extensions`.
3. Enable **Developer mode** (toggle at top right).
4. Click **Load unpacked** and select the project folder.
5. A new tab will now use this extension.

---

## Usage

- Open a new tab to view your custom dashboard.
- Click **+** under Quick Links to add a new link.
- Use the gear icon to open settings for wallpapers and theme mode.

---

## Customization

- **Quick Links**: Stored in Chrome `storage.sync`. Open settings to edit or reorder.
- **Wallpapers**: Add image files to `wallpapers/` and update `newtab.js` if needed.
- **Search Engine**: Change the search URL in `newtab.js` (default: Google).
- **Color Scheme**: Customize the modern color palette in `styles.css`.
- **Gradient Background**: Adjust the dynamic color wheel gradient in `styles.css`.
- **Fonts & Layout**: Modify typography and layout settings in `styles.css`.

---

## File Structure

```plaintext
chrome-startup/
├── icons/              # Extension icons (PNG)
├── wallpapers/         # Default wallpapers
├── manifest.json       # Extension configuration (MV3)
├── newtab.html         # HTML template for new tab page
├── newtab.js           # Main JavaScript logic
├── styles.css          # Styling for the dashboard
├── README.md           # This documentation
```

---

## Development

- Uses vanilla JavaScript and CSS—no build step required.
- To test changes, reload the extension in `chrome://extensions`.
- Use the browser console for debugging (`F12`).

---

## Contributing

Contributions are welcome! Feel free to:

- Submit issues or feature requests.
- Open pull requests with improvements, bug fixes, or documentation updates.

---

## FAQs

### 1. Can I use a custom search engine?
Yes, update the search URL in `newtab.js`.

### 2. How do I add my own wallpapers?
Place the image files in the `wallpapers/` folder and update `newtab.js` if required.

### 3. How do I reset the quick links?
Open Chrome's developer tools, go to Application > Storage, and clear the `storage.sync` data.

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
