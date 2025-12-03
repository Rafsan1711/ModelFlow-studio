/**
 * ============================================
 * DOM HELPERS
 * Utility functions for DOM manipulation
 * ============================================
 */

/**
 * Create element with props
 */
export function createElement(tag, props = {}, children = []) {
    const element = document.createElement(tag);

    // Set properties
    Object.keys(props).forEach(key => {
        if (key === 'className') {
            element.className = props[key];
        } else if (key === 'dataset') {
            Object.keys(props[key]).forEach(dataKey => {
                element.dataset[dataKey] = props[key][dataKey];
            });
        } else if (key.startsWith('on')) {
            const eventName = key.substring(2).toLowerCase();
            element.addEventListener(eventName, props[key]);
        } else {
            element[key] = props[key];
        }
    });

    // Append children
    children.forEach(child => {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else if (child instanceof Node) {
            element.appendChild(child);
        }
    });

    return element;
}

/**
 * Select element
 */
export function $(selector) {
    return document.querySelector(selector);
}

/**
 * Select all elements
 */
export function $$(selector) {
    return Array.from(document.querySelectorAll(selector));
}

/**
 * Add event listener with cleanup
 */
export function on(element, event, handler, options) {
    element.addEventListener(event, handler, options);
    return () => element.removeEventListener(event, handler, options);
}

/**
 * Toggle class
 */
export function toggleClass(element, className, force) {
    element.classList.toggle(className, force);
}

/**
 * Show element
 */
export function show(element, display = 'block') {
    element.style.display = display;
}

/**
 * Hide element
 */
export function hide(element) {
    element.style.display = 'none';
}

console.log('📦 DOM Helpers module loaded');
