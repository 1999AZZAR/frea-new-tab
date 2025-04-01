// --- Constants ---
const DOM_SELECTORS = {
    QUICK_LINKS_CONTAINER: '#quick-links',
    BOOKMARKS_CONTAINER: '#bookmarks-container',
    ADD_LINK_BTN: '#add-link-btn',
    ADD_BOOKMARK_BTN: '#add-bookmark-btn',
    BOOKMARKS_SECTION: '#bookmarks-section',
    LINK_MODAL: '#link-modal',
    LINK_MODAL_TITLE: '#link-modal-title',
    LINK_FORM: '#link-form',
    LINK_URL_INPUT: '#link-url',
    LINK_NAME_INPUT: '#link-name',
    LINK_MODAL_CANCEL: '#link-modal-cancel',
    SETTINGS_TOGGLE: '#settings-toggle',
    BACKGROUND_SETTINGS: '#background-settings',
    CLOSE_SETTINGS_BTN: '#close-settings',
    THEME_SWITCH: '#theme-switch',
    BACKGROUND_INPUT: '#background-input',
    BACKGROUND_APPLY_BTN: '#background-apply',
    SEARCH_FORM: '#search-form',
    GOOGLE_SEARCH_INPUT: '#google-search',
    BOOKMARK_SEARCH_INPUT: '#bookmark-search',
    CLOCK: '#clock',
    DATE: '#date',
    EXPORT_LINKS_BTN: '#export-links-btn',
    IMPORT_LINKS_BTN: '#import-links-btn',
    IMPORT_EXPORT_CONTAINER_CLASS: '.import-export-controls', // For insertion point
};

const CSS_CLASSES = {
    HIDDEN: 'hidden',
    ACTIVE: 'active',
    DRAGGING: 'dragging',
    DARK_THEME: 'dark-theme',
    LINK_CARD: 'link-card',
    ADD_LINK_CARD: 'add-link-card',
    DELETE_BTN: 'delete-btn',
    EDIT_BTN: 'edit-btn',
    BOOKMARK_CARD: 'bookmark-card',
};

const STORAGE_KEYS = {
    QUICK_LINKS: 'customNewTabQuickLinks',
    THEME: 'customNewTabTheme',
    BACKGROUND: 'customNewTabBackground'
};

const ARIA_LABELS = {
    QUICK_LINKS_CONTAINER: 'Quick Links',
    BOOKMARKS_CONTAINER: 'Bookmarks',
    DELETE_LINK: 'Delete link',
    EDIT_LINK: 'Edit link',
    DELETE_BOOKMARK: 'Delete bookmark',
    EDIT_BOOKMARK: 'Edit bookmark',
};

// --- Utilities ---

/**
 * Safely gets an element by ID and logs an error if not found.
 * @param {string} id The element ID.
 * @param {string} contextName Optional context for error logging.
 * @returns {HTMLElement|null} The element or null.
 */
function getElementByIdSafe(id, contextName = '') {
    const element = document.getElementById(id.startsWith('#') ? id.substring(1) : id);
    if (!element) {
        console.error(`Element with ID '${id}' not found${contextName ? ` in ${contextName}` : ''}.`);
    }
    return element;
}

/**
 * Creates a URL for fetching a website's favicon.
 * @param {string} url The website URL.
 * @returns {string} The favicon service URL.
 */
function getFaviconUrl(url) {
    // Using a reliable favicon service (duckduckgo is often good)
    try {
        const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
        return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
    } catch (e) {
        console.warn(`Could not parse URL for favicon: ${url}`, e);
        // Fallback or placeholder
        return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path fill="%23ccc" d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm0 14.5a6.5 6.5 0 1 1 0-13a6.5 6.5 0 0 1 0 13zM8 4a1 1 0 0 1 1 1v3a1 1 0 1 1-2 0V5a1 1 0 0 1 1-1zm0 6a1 1 0 1 1 0 2a1 1 0 0 1 0-2z"/></svg>';
    }
}

// --- Core Modules / Classes ---

class StorageManager {
    static getItem(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            // Allow null as a valid stored value, differentiate from not found
            if (item === null) return defaultValue;
            // Check if it looks like JSON before parsing
            if (item.startsWith('{') || item.startsWith('[')) {
                return JSON.parse(item);
            }
            // Return raw string if not JSON (for simple values like theme/background)
            return item;
        } catch (error) {
            console.error(`Error retrieving ${key} from localStorage:`, error);
            // Clear potentially corrupted item
            localStorage.removeItem(key);
            return defaultValue;
        }
    }

    static setItem(key, value) {
        try {
            const valueToStore = (typeof value === 'object' && value !== null)
                ? JSON.stringify(value)
                : String(value); // Store primitives as strings
            localStorage.setItem(key, valueToStore);
        } catch (error) {
            console.error(`Error saving ${key} to localStorage:`, error);
            // Potentially handle quota exceeded error
        }
    }

    static removeItem(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error(`Error removing ${key} from localStorage:`, error);
        }
    }
}

class AccessibilityManager {
    static setupKeyboardNavigation() {
        const containers = [
            { id: DOM_SELECTORS.QUICK_LINKS_CONTAINER.substring(1), label: ARIA_LABELS.QUICK_LINKS_CONTAINER },
            { id: DOM_SELECTORS.BOOKMARKS_CONTAINER.substring(1), label: ARIA_LABELS.BOOKMARKS_CONTAINER }
        ];

        containers.forEach(({ id, label }) => {
            const container = getElementByIdSafe(id, 'setupKeyboardNavigation');
            if (!container) return;

            container.setAttribute('tabindex', '0');
            container.setAttribute('aria-label', label);

            container.addEventListener('keydown', (e) => {
                // Focus only focusable link cards (not add buttons, not hidden ones)
                const links = Array.from(container.querySelectorAll(`.${CSS_CLASSES.LINK_CARD}:not(.${CSS_CLASSES.ADD_LINK_CARD}):not(.${CSS_CLASSES.HIDDEN})`));
                if (links.length === 0) return;

                const currentIndex = links.findIndex(link => document.activeElement === link);

                let nextIndex = -1;

                switch (e.key) {
                    case 'ArrowRight':
                    case 'ArrowDown': // Allow vertical nav too
                        e.preventDefault();
                        nextIndex = (currentIndex + 1) % links.length;
                        break;
                    case 'ArrowLeft':
                    case 'ArrowUp': // Allow vertical nav too
                        e.preventDefault();
                        nextIndex = (currentIndex - 1 + links.length) % links.length;
                        break;
                    case 'Enter':
                    case ' ': // Allow spacebar activation
                        if (currentIndex !== -1 && document.activeElement === links[currentIndex]) {
                            e.preventDefault();
                            links[currentIndex].click();
                        }
                        break;
                    case 'Home':
                         e.preventDefault();
                         nextIndex = 0;
                         break;
                    case 'End':
                         e.preventDefault();
                         nextIndex = links.length - 1;
                         break;
                }

                if (nextIndex !== -1) {
                    links[nextIndex].focus();
                }
            });
        });
    }

    static enhanceLinkAccessibility(containerSelector) {
        const container = document.querySelector(containerSelector);
        if (!container) {
             console.error(`Container '${containerSelector}' not found for enhancing link accessibility.`);
             return;
        }

        // Use MutationObserver to handle dynamically added links
        const observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains(CSS_CLASSES.LINK_CARD)) {
                            this.applyAccessibilityAttributes(node);
                        }
                        // Also check children if a wrapper was added
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            node.querySelectorAll(`.${CSS_CLASSES.LINK_CARD}`).forEach(card => this.applyAccessibilityAttributes(card));
                        }
                    });
                }
            }
        });

        // Apply to existing cards
        container.querySelectorAll(`.${CSS_CLASSES.LINK_CARD}`).forEach(card => this.applyAccessibilityAttributes(card));

        // Observe the container for future changes
        observer.observe(container, { childList: true, subtree: true });
    }

     static applyAccessibilityAttributes(card) {
         // Don't make 'add' buttons act like links
         if (card.classList.contains(CSS_CLASSES.ADD_LINK_CARD)) {
            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', '0');
            card.setAttribute('aria-label', card.querySelector('p')?.textContent || 'Add new item');
            // Add keyboard interaction for add buttons too
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    card.click();
                }
            });
            return; // Skip link-specific attributes for add card
         }

         card.setAttribute('tabindex', '0');
         card.setAttribute('role', 'link'); // Use 'link' role since they navigate
         const titleElement = card.querySelector('p');
         const url = card.getAttribute('data-url');
         card.setAttribute('aria-label', titleElement?.textContent || `Link to ${url}` || 'Unnamed link');

         // Keyboard interaction for regular links (handled by container nav, but space/enter specifically)
         // Check if listener already exists to avoid duplicates if re-rendered
        if (!card.dataset.keyListenerAdded) {
             card.addEventListener('keydown', (e) => {
                 if (e.key === 'Enter' || e.key === ' ') {
                     // Prevent scrolling on spacebar
                     e.preventDefault();
                     // Ensure click navigates/opens the link
                     card.click();
                 }
             });
             card.dataset.keyListenerAdded = 'true';
         }
     }

    static lazyLoadFavicons(containerSelector) {
        const container = document.querySelector(containerSelector);
         if (!container) {
             console.error(`Container '${containerSelector}' not found for lazy loading.`);
             return;
         }

        const placeholderSvg = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><rect width="16" height="16" fill="%23eee"/></svg>';

        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const actualSrc = img.dataset.src;
                    if (actualSrc && img.src !== actualSrc) { // Load only if src is different
                       img.src = actualSrc;
                       img.onload = () => img.classList.remove('loading'); // Optional: remove loading state
                       img.onerror = () => { // Handle loading errors
                            img.src = placeholderSvg; // Fallback to placeholder on error
                            img.classList.remove('loading');
                            console.warn(`Failed to load favicon: ${actualSrc}`);
                       };
                    }
                    observer.unobserve(img);
                }
            });
        }, { rootMargin: '100px' }); // Load slightly before entering viewport

        // Use MutationObserver to catch dynamically added images
         const setupImage = (img) => {
            if (img.dataset.lazyLoaded) return; // Already processed

            const currentSrc = img.getAttribute('src'); // Get the intended src attribute
            if (!img.dataset.src && currentSrc && !currentSrc.startsWith('data:')) {
                img.dataset.src = currentSrc; // Store the intended src
            }

            if (img.dataset.src) {
                 img.src = placeholderSvg; // Set placeholder
                 img.classList.add('loading'); // Optional: add loading class for styling
                 imageObserver.observe(img);
                 img.dataset.lazyLoaded = 'true'; // Mark as processed
            }
         };

        const mutationObserver = new MutationObserver((mutationsList) => {
             for (const mutation of mutationsList) {
                 if (mutation.type === 'childList') {
                     mutation.addedNodes.forEach(node => {
                         if (node.nodeType === Node.ELEMENT_NODE) {
                             if (node.tagName === 'IMG' && node.closest(`.${CSS_CLASSES.LINK_CARD}`)) {
                                 setupImage(node);
                             } else {
                                 node.querySelectorAll(`.${CSS_CLASSES.LINK_CARD} img`).forEach(setupImage);
                             }
                         }
                     });
                 }
             }
         });

         // Setup existing images
         container.querySelectorAll(`.${CSS_CLASSES.LINK_CARD} img`).forEach(setupImage);

         // Observe container
         mutationObserver.observe(container, { childList: true, subtree: true });
    }
}

class DragDropManager {
    static setupDragDrop(containerSelector, getEntitiesCallback, saveEntitiesCallback) {
        const container = document.querySelector(containerSelector);
        if (!container) {
            console.error(`DragDrop container '${containerSelector}' not found.`);
            return;
        }

        let draggedItemIndex = null;

        container.addEventListener('dragstart', (e) => {
            const linkCard = e.target.closest(`.${CSS_CLASSES.LINK_CARD}:not(.${CSS_CLASSES.ADD_LINK_CARD})`);
            if (linkCard) {
                linkCard.classList.add(CSS_CLASSES.DRAGGING);
                draggedItemIndex = parseInt(linkCard.getAttribute('data-index'), 10);
                // Use index in dataTransfer for simplicity here, could use unique ID if available
                e.dataTransfer.setData('text/plain', draggedItemIndex);
                e.dataTransfer.effectAllowed = 'move';
            } else {
                e.preventDefault(); // Prevent dragging if not a valid card
            }
        });

        container.addEventListener('dragend', (e) => {
             // Use event delegation target if needed, but querySelector is safer if structure changes
            const draggingElement = container.querySelector(`.${CSS_CLASSES.DRAGGING}`);
            if (draggingElement) {
                draggingElement.classList.remove(CSS_CLASSES.DRAGGING);
            }
            draggedItemIndex = null; // Reset index
        });

        container.addEventListener('dragover', (e) => {
            e.preventDefault(); // Necessary to allow drop
            e.dataTransfer.dropEffect = 'move';

            const draggingElement = container.querySelector(`.${CSS_CLASSES.DRAGGING}`);
            if (!draggingElement) return;

            const afterElement = this.getDragAfterElement(container, e.clientY);

            if (afterElement == null) {
                // Append to the end, but before the 'add' button if it exists
                const addBtn = container.querySelector(`.${CSS_CLASSES.ADD_LINK_CARD}`);
                if (addBtn) {
                    container.insertBefore(draggingElement, addBtn);
                } else {
                     container.appendChild(draggingElement);
                }
            } else {
                container.insertBefore(draggingElement, afterElement);
            }
        });

        container.addEventListener('drop', (e) => {
            e.preventDefault();
             const draggingElement = container.querySelector(`.${CSS_CLASSES.DRAGGING}`); // Find the element that was just dropped
             if (!draggingElement || draggedItemIndex === null) return; // Check if we have the element and its original index

            // Get the current state of entities
            const entities = getEntitiesCallback();
            if (!entities || draggedItemIndex >= entities.length) {
                 console.error("Error during drop: Invalid entity state or index.");
                 return; // Prevent errors if data is out of sync
             }

             // Remove the dragged entity from its original position
             const [draggedEntity] = entities.splice(draggedItemIndex, 1);

            // Find the new index based on the final DOM order
            const currentCards = Array.from(container.querySelectorAll(`.${CSS_CLASSES.LINK_CARD}:not(.${CSS_CLASSES.ADD_LINK_CARD})`));
            const newIndex = currentCards.indexOf(draggingElement);

            if (newIndex > -1) {
                // Insert the entity at the new position
                entities.splice(newIndex, 0, draggedEntity);
                // Save the reordered entities
                saveEntitiesCallback(entities);
                // Re-render or update indices immediately after save
                // Note: If saveEntitiesCallback triggers a re-render, this might be redundant
                // If not, manually update data-index attributes here
                 currentCards.forEach((card, index) => card.setAttribute('data-index', index));
            } else {
                 console.error("Could not determine new index after drop.");
                 // Optionally revert or re-fetch state
             }
        });
    }

    static getDragAfterElement(container, y) {
        // Select only actual draggable items, excluding the one being dragged and the add button
        const draggableElements = [...container.querySelectorAll(`.${CSS_CLASSES.LINK_CARD}:not(.${CSS_CLASSES.DRAGGING}):not(.${CSS_CLASSES.ADD_LINK_CARD})`)];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;

            // Find the element just below the cursor
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element; // Default to null (append)
    }
}

class ImportExportManager {
    static exportData(key, filenamePrefix) {
        const data = StorageManager.getItem(key, []);
        if (!data || data.length === 0) {
            alert('No data to export.');
            return;
        }

        const exportString = JSON.stringify(data, null, 2); // Pretty print JSON
        const blob = new Blob([exportString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.style.display = 'none'; // Hide the link
        a.href = url;
        a.download = `${filenamePrefix}-export-${new Date().toISOString().split('T')[0]}.json`;

        document.body.appendChild(a);
        a.click();

        // Clean up
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    static importData(key, validationFn, confirmationMsg, successCallback) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json'; // Be explicit
        input.style.display = 'none';

        input.onchange = (e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            const reader = new FileReader();

            reader.onload = (event) => {
                try {
                    const importedData = JSON.parse(event.target.result);

                    if (!validationFn(importedData)) {
                        throw new Error('Invalid import file format or content.');
                    }

                    if (confirm(confirmationMsg)) {
                        StorageManager.setItem(key, importedData);
                        if (successCallback) successCallback(importedData); // Pass data if needed
                        alert('Data imported successfully!');
                    }
                } catch (error) {
                    console.error('Import error:', error);
                    alert(`Failed to import data. ${error.message || 'Please check the file and try again.'}`);
                }
            };

            reader.onerror = () => {
                 alert(`Error reading file: ${reader.error}`);
            };

            reader.readAsText(file);
        };

        document.body.appendChild(input); // Required for some browsers
        input.click();
        document.body.removeChild(input); // Clean up
    }

     // Specific validation for Quick Links
     static validateQuickLinksImport(data) {
        return Array.isArray(data) && data.every(link =>
            link && typeof link === 'object' && link.url && link.name &&
            typeof link.url === 'string' && typeof link.name === 'string'
         );
     }

    static setupImportExportButtons(containerSelector, quickLinksManager) {
        const settingsContainer = document.querySelector(containerSelector);
        if (!settingsContainer) {
            console.error(`Settings container '${containerSelector}' not found for Import/Export buttons.`);
            return;
        }

        // Check if controls already exist
        if (settingsContainer.querySelector(DOM_SELECTORS.IMPORT_EXPORT_CONTAINER_CLASS)) {
            return;
        }

        const importExportContainer = document.createElement('div');
        importExportContainer.className = DOM_SELECTORS.IMPORT_EXPORT_CONTAINER_CLASS.substring(1); // Remove leading '.'
        importExportContainer.innerHTML = `
            <h4>Data Management</h4>
            <div class="setting-item">
                <button id="${DOM_SELECTORS.EXPORT_LINKS_BTN.substring(1)}" class="btn btn-secondary">Export Quick Links</button>
                <button id="${DOM_SELECTORS.IMPORT_LINKS_BTN.substring(1)}" class="btn btn-secondary">Import Quick Links</button>
            </div>
        `;

        // Append controls (e.g., after background settings)
        settingsContainer.appendChild(importExportContainer);

        // Add listeners safely
        const exportBtn = getElementByIdSafe(DOM_SELECTORS.EXPORT_LINKS_BTN);
        const importBtn = getElementByIdSafe(DOM_SELECTORS.IMPORT_LINKS_BTN);

        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData(STORAGE_KEYS.QUICK_LINKS, 'quick-links'));
        }

        if (importBtn) {
            importBtn.addEventListener('click', () => this.importData(
                STORAGE_KEYS.QUICK_LINKS,
                this.validateQuickLinksImport,
                'Are you sure you want to replace ALL existing quick links with the imported ones?',
                () => quickLinksManager.render() // Re-render after successful import
            ));
        }
    }
}

class EntityManager {
    constructor(storageKey, containerSelector, addButtonSelector, cardCreatorFn) {
        this.storageKey = storageKey;
        this.container = document.querySelector(containerSelector);
        this.addButton = this.container?.querySelector(addButtonSelector); // Find add button within container
        this.cardCreator = cardCreatorFn;

        if (!this.container) {
            console.error(`Entity container '${containerSelector}' not found.`);
        }
        // Add button might be dynamic, find it during render if needed
    }

    getEntities() {
        return StorageManager.getItem(this.storageKey, []); // Default to empty array
    }

    saveEntities(entities) {
        StorageManager.setItem(this.storageKey, entities);
        this.render(); // Re-render after saving to reflect changes
    }

    addEntity(data) { // Accepts an object { url, name }
        const entities = this.getEntities();
        // Optional: Check for duplicates?
        entities.push(data);
        this.saveEntities(entities);
    }

    updateEntity(index, data) { // Accepts an object { url, name }
        const entities = this.getEntities();
        if (index >= 0 && index < entities.length) {
            entities[index] = { ...entities[index], ...data }; // Merge data, keeps potential other props
            this.saveEntities(entities);
        } else {
            console.error(`Invalid index ${index} for updateEntity.`);
        }
    }

    removeEntity(index) {
        const entities = this.getEntities();
        if (index >= 0 && index < entities.length) {
            entities.splice(index, 1);
            this.saveEntities(entities);
        } else {
            console.error(`Invalid index ${index} for removeEntity.`);
        }
    }

    render() {
        if (!this.container) return;

        const entities = this.getEntities();
        // Preserve the "Add" button if it exists and is managed by this manager
        const addButtonElement = this.addButton || this.container.querySelector(`.${CSS_CLASSES.ADD_LINK_CARD}`); // Try to find if not cached

        // Clear only the entity cards, not the add button
        this.container.querySelectorAll(`.${CSS_CLASSES.LINK_CARD}:not(.${CSS_CLASSES.ADD_LINK_CARD})`).forEach(card => card.remove());

        // Render entities and insert them *before* the add button
        entities.forEach((entity, index) => {
            // Ensure entity has needed props; provide defaults if necessary
            const url = entity?.url ?? '';
            const name = entity?.name ?? 'Unnamed Link';
            const card = this.cardCreator(url, name, index, false); // false = not a bookmark card
            if (addButtonElement) {
                this.container.insertBefore(card, addButtonElement);
            } else {
                this.container.appendChild(card); // Append if no add button
            }
        });

        // Optionally: Re-enhance accessibility & lazy loading if not handled by observers
        // AccessibilityManager.enhanceLinkAccessibility(this.container.id);
        // AccessibilityManager.lazyLoadFavicons(this.container.id);
    }
}

class UIManager {
    // Cache elements that are frequently accessed or configured
    static elements = {
        body: document.body,
        settingsToggle: null,
        backgroundSettings: null,
        closeSettingsBtn: null,
        themeSwitch: null,
        backgroundInput: null,
        backgroundApplyBtn: null,
        linkModal: null,
        linkModalTitle: null,
        linkForm: null,
        linkUrlInput: null,
        linkNameInput: null,
        linkModalCancel: null,
        clock: null,
        date: null,
    };

    static init() {
        // Cache elements on init
        this.elements.settingsToggle = getElementByIdSafe(DOM_SELECTORS.SETTINGS_TOGGLE, 'UIManager init');
        this.elements.backgroundSettings = getElementByIdSafe(DOM_SELECTORS.BACKGROUND_SETTINGS, 'UIManager init');
        this.elements.closeSettingsBtn = getElementByIdSafe(DOM_SELECTORS.CLOSE_SETTINGS_BTN, 'UIManager init');
        this.elements.themeSwitch = getElementByIdSafe(DOM_SELECTORS.THEME_SWITCH, 'UIManager init');
        this.elements.backgroundInput = getElementByIdSafe(DOM_SELECTORS.BACKGROUND_INPUT, 'UIManager init');
        this.elements.backgroundApplyBtn = getElementByIdSafe(DOM_SELECTORS.BACKGROUND_APPLY_BTN, 'UIManager init');
        this.elements.linkModal = getElementByIdSafe(DOM_SELECTORS.LINK_MODAL, 'UIManager init');
        this.elements.linkModalTitle = getElementByIdSafe(DOM_SELECTORS.LINK_MODAL_TITLE, 'UIManager init');
        this.elements.linkForm = getElementByIdSafe(DOM_SELECTORS.LINK_FORM, 'UIManager init');
        this.elements.linkUrlInput = getElementByIdSafe(DOM_SELECTORS.LINK_URL_INPUT, 'UIManager init');
        this.elements.linkNameInput = getElementByIdSafe(DOM_SELECTORS.LINK_NAME_INPUT, 'UIManager init');
        this.elements.linkModalCancel = getElementByIdSafe(DOM_SELECTORS.LINK_MODAL_CANCEL, 'UIManager init');
        this.elements.clock = getElementByIdSafe(DOM_SELECTORS.CLOCK, 'UIManager init');
        this.elements.date = getElementByIdSafe(DOM_SELECTORS.DATE, 'UIManager init');

        // Setup components that rely on these elements
        this.setupSearchForm(DOM_SELECTORS.SEARCH_FORM, DOM_SELECTORS.GOOGLE_SEARCH_INPUT);
        this.setupSearchFilter(DOM_SELECTORS.BOOKMARK_SEARCH_INPUT, DOM_SELECTORS.BOOKMARKS_CONTAINER);
        this.setupThemeToggle();
        this.setupBackgroundImage();
        this.setupSettingsToggle();
        this.setupClockAndDate();
        this.setupModal();
    }

    static setupSearchForm(formSelector, inputSelector) {
        const form = document.querySelector(formSelector);
        const input = document.querySelector(inputSelector);
        if (!form || !input) {
             console.error(`Search form ('${formSelector}') or input ('${inputSelector}') not found.`);
             return;
        }

        form.addEventListener('submit', (e) => {
            // Allow submission even if empty, Google handles it. Add validation if needed.
            // if (input.value.trim() === '') {
            //     e.preventDefault();
            // }
        });
    }

    static setupSearchFilter(inputSelector, containerSelector) {
        const searchInput = document.querySelector(inputSelector);
        const container = document.querySelector(containerSelector);
        if (!searchInput || !container) {
            console.error(`Search filter input ('${inputSelector}') or container ('${containerSelector}') not found.`);
            return;
        }

        searchInput.addEventListener('input', function() { // Use function for 'this'
            const searchTerm = this.value.toLowerCase().trim();
            const cards = container.querySelectorAll(`.${CSS_CLASSES.LINK_CARD}:not(.${CSS_CLASSES.ADD_LINK_CARD})`);

            cards.forEach(card => {
                const title = card.getAttribute('data-title') || ''; // Already lowercase from card creator? Verify.
                const url = card.getAttribute('data-url') || '';
                const isVisible = searchTerm === '' || title.includes(searchTerm) || url.toLowerCase().includes(searchTerm);
                card.classList.toggle(CSS_CLASSES.HIDDEN, !isVisible);
                // Ensure hidden items aren't keyboard accessible
                card.setAttribute('tabindex', isVisible ? '0' : '-1');
                card.setAttribute('aria-hidden', !isVisible);
            });
        });
    }

    static setupSettingsToggle() {
        const { settingsToggle, backgroundSettings, closeSettingsBtn } = this.elements;
        if (!settingsToggle || !backgroundSettings || !closeSettingsBtn) {
            console.error('One or more settings elements not found for toggle setup.');
            return;
        }

        const openSettings = () => {
            backgroundSettings.classList.remove(CSS_CLASSES.HIDDEN);
            settingsToggle.classList.add(CSS_CLASSES.ACTIVE);
            settingsToggle.setAttribute('aria-expanded', 'true');
            backgroundSettings.focus(); // Focus the panel for accessibility
        };

        const closeSettings = () => {
            backgroundSettings.classList.add(CSS_CLASSES.HIDDEN);
            settingsToggle.classList.remove(CSS_CLASSES.ACTIVE);
            settingsToggle.setAttribute('aria-expanded', 'false');
            settingsToggle.focus(); // Return focus to the toggle
        };

        settingsToggle.setAttribute('aria-controls', backgroundSettings.id);
        settingsToggle.setAttribute('aria-expanded', 'false');


        settingsToggle.addEventListener('click', () => {
            const isHidden = backgroundSettings.classList.contains(CSS_CLASSES.HIDDEN);
            if (isHidden) {
                openSettings();
            } else {
                closeSettings();
            }
        });

        closeSettingsBtn.addEventListener('click', closeSettings);

        // Close on escape key
         backgroundSettings.addEventListener('keydown', (event) => {
             if (event.key === 'Escape') {
                 closeSettings();
             }
         });

        // Close settings when clicking outside
        document.addEventListener('click', (event) => {
            if (!backgroundSettings.classList.contains(CSS_CLASSES.HIDDEN) &&
                !backgroundSettings.contains(event.target) &&
                !settingsToggle.contains(event.target)) {
                closeSettings();
            }
        });
    }

    static setupThemeToggle() {
        const { themeSwitch, body } = this.elements;
        if (!themeSwitch || !body) {
            console.error('Theme switch or body element not found.');
            return;
        }

        const applyTheme = (theme) => {
             body.classList.toggle(CSS_CLASSES.DARK_THEME, theme === 'dark');
             themeSwitch.checked = (theme === 'dark');
             StorageManager.setItem(STORAGE_KEYS.THEME, theme);
             // Ensure related elements update if needed (e.g., settings panel background)
        };

        // Load saved theme on init
        const savedTheme = StorageManager.getItem(STORAGE_KEYS.THEME, 'light'); // Default to light
        applyTheme(savedTheme);

        // Listen for changes
        themeSwitch.addEventListener('change', function() { // Use function for 'this'
            applyTheme(this.checked ? 'dark' : 'light');
        });
    }

    static setupBackgroundImage() {
        const { backgroundInput, backgroundApplyBtn, body } = this.elements;
         if (!backgroundInput || !backgroundApplyBtn || !body) {
             console.error('Background elements or body not found.');
             return;
         }

         const applyBackground = (imageUrl) => {
             if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '') {
                 // Basic validation: Check if it looks like a URL or data URI
                 if (imageUrl.startsWith('http') || imageUrl.startsWith('data:image')) {
                      body.style.backgroundImage = `url('${imageUrl}')`;
                      StorageManager.setItem(STORAGE_KEYS.BACKGROUND, imageUrl);
                      backgroundInput.value = imageUrl; // Update input field
                 } else {
                      alert("Invalid background image URL. Please provide a valid URL (starting with http/https) or a data URI.");
                 }
             } else {
                 // Clear background
                 body.style.backgroundImage = 'none';
                 StorageManager.removeItem(STORAGE_KEYS.BACKGROUND); // Or set to empty string ''
                 backgroundInput.value = ''; // Clear input field
             }
         };

         // Load saved background
         const savedBackground = StorageManager.getItem(STORAGE_KEYS.BACKGROUND);
         if (savedBackground) {
             applyBackground(savedBackground);
         }

         backgroundApplyBtn.addEventListener('click', () => {
             applyBackground(backgroundInput.value.trim());
         });

         // Optional: Apply on Enter key in input field
         backgroundInput.addEventListener('keypress', (e) => {
             if (e.key === 'Enter') {
                 e.preventDefault(); // Prevent form submission if applicable
                 applyBackground(backgroundInput.value.trim());
             }
         });
    }

     // --- Modal Management ---
     static currentModalContext = null; // Stores { mode, manager, index, bookmarkInfo }

     static setupModal() {
         const { linkModal, linkForm, linkModalCancel } = this.elements;
         if (!linkModal || !linkForm || !linkModalCancel) {
             console.error("Modal elements not found for setup.");
             return;
         }

         // Single submit listener for the form
         linkForm.addEventListener('submit', async (e) => {
             e.preventDefault();
             if (!this.currentModalContext) return;

             const { mode, manager, index, bookmarkInfo } = this.currentModalContext;
             const url = this.elements.linkUrlInput.value.trim();
             const name = this.elements.linkNameInput.value.trim();

             if (!url || !name) {
                 alert("Both URL and Name are required.");
                 return;
             }

             // Basic URL validation (add more sophisticated check if needed)
              try {
                  new URL(url.startsWith('http') ? url : `https://${url}`);
              } catch (_) {
                  alert("Please enter a valid URL.");
                  return;
              }

             this.hideModal(); // Hide modal optimistically

             try {
                 if (bookmarkInfo) { // Handling a bookmark
                     if (mode === 'edit') {
                         await BookmarksManager.updateBookmark(bookmarkInfo.id, url, name);
                     } else { // mode === 'add'
                         await BookmarksManager.createBookmark(url, name); // Assume root or specific parent logic needed
                     }
                     await BookmarksManager.renderBookmarks( // Re-render bookmarks
                         DOM_SELECTORS.BOOKMARKS_CONTAINER,
                         () => this.showModal('add', null, null, { isBookmark: true }), // Add callback
                         (b) => this.showModal('edit', null, null, { isBookmark: true, id: b.id, url: b.url, title: b.title }), // Edit callback
                         async (bId) => { // Delete callback
                              if (confirm('Are you sure you want to delete this bookmark?')) {
                                  await BookmarksManager.removeBookmark(bId);
                                  await BookmarksManager.renderBookmarks(DOM_SELECTORS.BOOKMARKS_CONTAINER, /* pass callbacks again */); // Re-render after delete
                              }
                          }
                     );
                 } else if (manager) { // Handling a quick link (managed entity)
                     if (mode === 'edit') {
                         manager.updateEntity(index, { url, name }); // EntityManager should trigger re-render via saveEntities
                     } else { // mode === 'add'
                         manager.addEntity({ url, name }); // EntityManager should trigger re-render via saveEntities
                     }
                 }
             } catch (error) {
                 console.error(`${mode === 'edit' ? 'Update' : 'Add'} operation failed:`, error);
                 alert(`Failed to ${mode} ${bookmarkInfo ? 'bookmark' : 'link'}. Please try again.`);
                 // Optionally re-show modal if needed: this.showModal(mode, manager, index, bookmarkInfo);
             } finally {
                 this.currentModalContext = null; // Clear context after operation
             }
         });

         linkModalCancel.addEventListener('click', () => this.hideModal());

         // Close modal on escape key
         linkModal.addEventListener('keydown', (event) => {
             if (event.key === 'Escape') {
                 this.hideModal();
             }
         });

         // Close modal on backdrop click
         linkModal.addEventListener('click', (event) => {
             if (event.target === linkModal) { // Check if the click was directly on the backdrop
                 this.hideModal();
             }
         });
     }

     /**
      * Shows the entity modal.
      * @param {'add'|'edit'} mode - The mode (add or edit).
      * @param {EntityManager|null} manager - The EntityManager instance (for quick links).
      * @param {number|null} index - The index of the entity (for quick link edit).
      * @param {object|null} bookmarkInfo - Bookmark data { isBookmark: true, id?, url?, title? }.
      */
     static showModal(mode, manager = null, index = null, bookmarkInfo = null) {
         const { linkModal, linkModalTitle, linkUrlInput, linkNameInput, linkForm } = this.elements;
         if (!linkModal || !linkModalTitle || !linkUrlInput || !linkNameInput) {
             console.error("Cannot show modal, essential elements missing.");
             return;
         }

         this.currentModalContext = { mode, manager, index, bookmarkInfo };

         linkForm.reset(); // Clear previous input values reliably

         const isBookmark = !!bookmarkInfo?.isBookmark;
         const entityType = isBookmark ? 'Bookmark' : 'Link';

         if (mode === 'edit') {
             linkModalTitle.textContent = `Edit ${entityType}`;
             const entity = isBookmark ? bookmarkInfo : manager?.getEntities()[index];
             if (entity) {
                linkUrlInput.value = entity.url || '';
                linkNameInput.value = entity.title || entity.name || ''; // Handle both bookmark 'title' and link 'name'
             } else {
                 console.error("Could not find entity data for editing.");
                 this.hideModal(); // Hide if data is missing
                 return;
             }
         } else { // mode === 'add'
             linkModalTitle.textContent = `Add New ${entityType}`;
         }

         linkModal.classList.remove(CSS_CLASSES.HIDDEN);
         linkUrlInput.focus(); // Focus the first input field
     }

     static hideModal() {
         const { linkModal, linkForm } = this.elements;
          if (linkModal) {
             linkModal.classList.add(CSS_CLASSES.HIDDEN);
          }
         if (linkForm) {
            linkForm.reset(); // Clear form on hide
         }
         this.currentModalContext = null; // Clear context when hiding
     }


    // --- Clock and Date ---
    static clockIntervalId = null;

    static setupClockAndDate() {
        const { clock, date } = this.elements;
         if (!clock || !date) {
             console.error('Clock or Date element not found.');
             return;
         }

        const formatTime = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        const formatDate = (d) => d.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        const updateDisplay = () => {
            const now = new Date();
            clock.textContent = formatTime(now);
            date.textContent = formatDate(now);
        };

        updateDisplay(); // Initial display
        // Clear previous interval if setup is called again
        if (this.clockIntervalId) clearInterval(this.clockIntervalId);
        this.clockIntervalId = setInterval(updateDisplay, 1000); // Update every second
    }
}

class BookmarksManager {
    // Check for API availability
    static isAvailable() {
        return typeof chrome !== 'undefined' && chrome.bookmarks;
    }

    static async performBookmarkAction(operation, ...args) {
        if (!this.isAvailable()) {
            return Promise.reject(new Error('Chrome Bookmarks API is not available.'));
        }
        return new Promise((resolve, reject) => {
            // Use chrome.runtime.lastError for better error handling in callbacks
            chrome.bookmarks[operation](...args, (result) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(result);
                }
            });
        });
    }

    static createBookmark = (url, title, parentId = '1') => // Default to Bookmarks Bar
        this.performBookmarkAction('create', { parentId, title, url });

    static updateBookmark = (id, url, title) =>
        this.performBookmarkAction('update', String(id), { url, title }); // Ensure ID is string

    static removeBookmark = (id) =>
        this.performBookmarkAction('remove', String(id)); // Ensure ID is string

    static getBookmark = async (id) => {
        try {
            const results = await this.performBookmarkAction('get', String(id));
            return results?.[0]; // 'get' returns an array
        } catch (error) {
            console.error(`Error getting bookmark ${id}:`, error);
            return null;
        }
    }

    static async renderBookmarks(containerSelector, addCallback, editCallback, deleteCallback) {
         if (!this.isAvailable()) {
             console.warn('Bookmarks API not available, skipping render.');
             const section = document.querySelector(DOM_SELECTORS.BOOKMARKS_SECTION);
             if(section) section.classList.add(CSS_CLASSES.HIDDEN);
             return;
         }

        const container = document.querySelector(containerSelector);
        const section = document.querySelector(DOM_SELECTORS.BOOKMARKS_SECTION);
        if (!container || !section) {
            console.error('Bookmarks container or section not found for rendering.');
            return;
        }

        container.innerHTML = ''; // Clear previous content

        // Add the "Add Bookmark" card
        const addBookmarkCard = document.createElement('div');
        addBookmarkCard.className = `${CSS_CLASSES.LINK_CARD} ${CSS_CLASSES.ADD_LINK_CARD}`;
        addBookmarkCard.id = DOM_SELECTORS.ADD_BOOKMARK_BTN.substring(1);
        addBookmarkCard.innerHTML = `
            <div class="add-icon">+</div>
            <p>Add Bookmark</p>
        `;
        addBookmarkCard.addEventListener('click', addCallback);
        AccessibilityManager.applyAccessibilityAttributes(addBookmarkCard); // Make it accessible
        container.appendChild(addBookmarkCard);

        try {
            const bookmarkTreeNodes = await this.performBookmarkAction('getTree');
            let bookmarkCount = 0;

            const processNodes = (nodes) => {
                nodes?.forEach(node => {
                    if (node.url && !node.url.startsWith('javascript:')) {
                        // Create and append bookmark card
                        const bookmarkCard = createLinkCard(node.url, node.title || node.url, node.id, true); // Use ID as index for bookmarks
                        container.appendChild(bookmarkCard);
                        bookmarkCount++;

                        // Attach specific listeners for bookmark edit/delete
                        const editBtn = bookmarkCard.querySelector(`.${CSS_CLASSES.EDIT_BTN}`);
                        const deleteBtn = bookmarkCard.querySelector(`.${CSS_CLASSES.DELETE_BTN}`);

                        if (editBtn) {
                            editBtn.onclick = (e) => { // Use onclick for simplicity here, or addEventListener if preferred
                                e.stopPropagation(); // Prevent card click
                                editCallback({ id: node.id, url: node.url, title: node.title });
                            };
                        }
                        if (deleteBtn) {
                             deleteBtn.onclick = (e) => {
                                 e.stopPropagation();
                                 deleteCallback(node.id);
                             };
                        }

                    } else if (node.children) {
                        processNodes(node.children); // Recurse into folders
                    }
                });
            };

            processNodes(bookmarkTreeNodes);

            // Show/hide the whole section based on whether bookmarks were found
            section.classList.toggle(CSS_CLASSES.HIDDEN, bookmarkCount === 0);

            // Enhance accessibility and lazy load after rendering
             AccessibilityManager.enhanceLinkAccessibility(containerSelector);
             AccessibilityManager.lazyLoadFavicons(containerSelector);

        } catch (error) {
            console.error('Error loading or processing bookmarks:', error);
            section.classList.add(CSS_CLASSES.HIDDEN); // Hide section on error
        }
    }
}

// --- Card Creation ---

/**
 * Creates a DOM element for a link or bookmark.
 * @param {string} url The URL of the link.
 * @param {string} name The display name of the link.
 * @param {string|number} idOrIndex Unique identifier (bookmark ID or quick link index).
 * @param {boolean} isBookmark Flag indicating if it's a bookmark.
 * @returns {HTMLDivElement} The created card element.
 */
function createLinkCard(url, name, idOrIndex, isBookmark = false) {
    const linkCard = document.createElement('div');
    linkCard.className = `${CSS_CLASSES.LINK_CARD} ${isBookmark ? CSS_CLASSES.BOOKMARK_CARD : ''}`;
    const faviconUrl = getFaviconUrl(url);
    const safeName = name || url; // Use URL if name is missing

    // Use data attributes consistently for easy access
    linkCard.setAttribute('data-url', url);
    linkCard.setAttribute('data-title', safeName.toLowerCase()); // For filtering
    linkCard.setAttribute(isBookmark ? 'data-id' : 'data-index', idOrIndex);
    linkCard.setAttribute('draggable', !isBookmark); // Only quick links are draggable

    linkCard.innerHTML = `
        <div class="card-content">
            <img src="${faviconUrl}" alt="" loading="lazy" width="16" height="16" class="favicon">
            <p class="link-name">${safeName}</p>
        </div>
        <div class="card-controls">
            <button class="${CSS_CLASSES.EDIT_BTN}" data-${isBookmark ? 'id' : 'index'}="${idOrIndex}" aria-label="${isBookmark ? ARIA_LABELS.EDIT_BOOKMARK : ARIA_LABELS.EDIT_LINK}">✎</button>
            <button class="${CSS_CLASSES.DELETE_BTN}" data-${isBookmark ? 'id' : 'index'}="${idOrIndex}" aria-label="${isBookmark ? ARIA_LABELS.DELETE_BOOKMARK : ARIA_LABELS.DELETE_LINK}">×</button>
        </div>
    `;
    // Find the img specifically to potentially set data-src for lazy loading if not handled by observer directly
    const img = linkCard.querySelector('img.favicon');
    if (img) img.dataset.src = faviconUrl; // Ensure lazy loader knows the target src

    // Main click action - use capturing phase maybe? Or just check target.
    linkCard.addEventListener('click', (e) => {
        // Prevent card click if a button inside was clicked
        if (e.target.closest(`.${CSS_CLASSES.EDIT_BTN}, .${CSS_CLASSES.DELETE_BTN}`)) {
            return;
        }
        // Navigate
        const targetUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
        window.open(targetUrl, '_blank', 'noopener,noreferrer'); // Security best practice
    });

    // Accessibility attributes are now primarily handled by AccessibilityManager.applyAccessibilityAttributes

    return linkCard;
}


// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM Content Loaded - Initializing New Tab");

    // Initialize UI Manager first to cache elements
    UIManager.init();

    // Setup Quick Links Manager
    const quickLinksManager = new EntityManager(
        STORAGE_KEYS.QUICK_LINKS,
        DOM_SELECTORS.QUICK_LINKS_CONTAINER,
        DOM_SELECTORS.ADD_LINK_BTN, // Selector for the add button within the container
        createLinkCard // Pass the card creator function
    );

    // Initial render of Quick Links
    quickLinksManager.render();

     // Setup Import/Export Buttons (needs quickLinksManager instance)
     ImportExportManager.setupImportExportButtons(
         DOM_SELECTORS.BACKGROUND_SETTINGS, // Where to add the buttons
         quickLinksManager
     );

    // Setup Drag and Drop for Quick Links
    DragDropManager.setupDragDrop(
        DOM_SELECTORS.QUICK_LINKS_CONTAINER,
        () => quickLinksManager.getEntities(), // Provide a function to get entities
        (updatedEntities) => quickLinksManager.saveEntities(updatedEntities) // Provide a function to save entities
    );

    // Event Delegation for Quick Links Container (Edit/Delete/Add)
    const quickLinksContainer = document.querySelector(DOM_SELECTORS.QUICK_LINKS_CONTAINER);
    if (quickLinksContainer) {
        quickLinksContainer.addEventListener('click', (e) => {
            const target = e.target;
            const editBtn = target.closest(`.${CSS_CLASSES.EDIT_BTN}`);
            const deleteBtn = target.closest(`.${CSS_CLASSES.DELETE_BTN}`);
            const addBtn = target.closest(DOM_SELECTORS.ADD_LINK_BTN); // Matches the ID

            if (editBtn) {
                 e.stopPropagation();
                const index = parseInt(editBtn.getAttribute('data-index'), 10);
                UIManager.showModal('edit', quickLinksManager, index);
            } else if (deleteBtn) {
                 e.stopPropagation();
                 if (confirm('Are you sure you want to delete this quick link?')) { // Add confirmation
                      const index = parseInt(deleteBtn.getAttribute('data-index'), 10);
                      quickLinksManager.removeEntity(index);
                 }
            } else if (addBtn) {
                 e.stopPropagation();
                UIManager.showModal('add', quickLinksManager);
            }
        });
    } else {
        console.error("Quick Links container not found for event delegation.");
    }

    // Load and Render Bookmarks (Bookmark edit/delete listeners are added within renderBookmarks)
    if (BookmarksManager.isAvailable()) {
         await BookmarksManager.renderBookmarks(
             DOM_SELECTORS.BOOKMARKS_CONTAINER,
              // Add Callback
              () => UIManager.showModal('add', null, null, { isBookmark: true }),
              // Edit Callback
              async (bookmarkData) => {
                  // Fetch full bookmark details if necessary, or use provided data
                  const fullBookmark = await BookmarksManager.getBookmark(bookmarkData.id);
                  if (fullBookmark) {
                      UIManager.showModal('edit', null, null, { ...fullBookmark, isBookmark: true });
                  } else {
                      alert("Could not retrieve bookmark details for editing.");
                  }
              },
              // Delete Callback
              async (bookmarkId) => {
                   if (confirm('Are you sure you want to delete this bookmark?')) {
                       try {
                           await BookmarksManager.removeBookmark(bookmarkId);
                           // Re-render after delete (renderBookmarks clears and rebuilds)
                            await BookmarksManager.renderBookmarks(
                                DOM_SELECTORS.BOOKMARKS_CONTAINER,
                                () => UIManager.showModal('add', null, null, { isBookmark: true }),
                                async (bData) => {
                                     const fullB = await BookmarksManager.getBookmark(bData.id);
                                     if(fullB) UIManager.showModal('edit', null, null, { ...fullB, isBookmark: true });
                                 },
                                 async (bId) => { /* Delete logic already here */ } // Can be simplified if needed
                            );
                       } catch (error) {
                           console.error("Failed to delete bookmark:", error);
                           alert("Failed to delete bookmark.");
                       }
                   }
               }
          );
    } else {
        // Hide bookmark section if API is unavailable
        const bookmarksSection = document.querySelector(DOM_SELECTORS.BOOKMARKS_SECTION);
        if (bookmarksSection) {
            bookmarksSection.classList.add(CSS_CLASSES.HIDDEN);
            console.log("Chrome Bookmarks API not available, hiding bookmarks section.");
        }
    }


    // Setup Accessibility Features (after initial content render)
    AccessibilityManager.setupKeyboardNavigation(); // Sets up container navigation
    // Enhancements below now use MutationObservers, apply to containers
     AccessibilityManager.enhanceLinkAccessibility(DOM_SELECTORS.QUICK_LINKS_CONTAINER);
     AccessibilityManager.enhanceLinkAccessibility(DOM_SELECTORS.BOOKMARKS_CONTAINER);
     AccessibilityManager.lazyLoadFavicons(DOM_SELECTORS.QUICK_LINKS_CONTAINER);
     AccessibilityManager.lazyLoadFavicons(DOM_SELECTORS.BOOKMARKS_CONTAINER);

    console.log("New Tab Initialization Complete.");
});
