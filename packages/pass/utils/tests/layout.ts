/** jsdom has no layout engine: every element measures 0x0 and has no
 * client rects. Virtualized lists (`AutoSizer`) render a single row at
 * most and autofill detection treats every field as hidden. Every
 * element gets the same box: geometry carries no signal in tests. */
const TEST_VIEWPORT = { width: 1280, height: 800 };

export const mockLayout = ({ width, height } = TEST_VIEWPORT) => {
    const rect = { x: 0, y: 0, top: 0, left: 0, right: width, bottom: height, width, height, toJSON: () => ({}) };

    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get: () => width });
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get: () => height });
    Object.defineProperty(Element.prototype, 'clientWidth', { configurable: true, get: () => width });
    Object.defineProperty(Element.prototype, 'clientHeight', { configurable: true, get: () => height });
    Element.prototype.getBoundingClientRect = () => rect as DOMRect;
    Element.prototype.getClientRects = () => [rect] as unknown as DOMRectList;

    /** jsdom does not implement pseudo-element styles: fall back to the element */
    if (!(window.getComputedStyle as { pseudoSafe?: boolean }).pseudoSafe) {
        const getComputedStyle = window.getComputedStyle.bind(window);
        window.getComputedStyle = Object.assign((element: Element) => getComputedStyle(element), { pseudoSafe: true });
    }

    window.ResizeObserver ??= class ResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
    };

    Object.defineProperty(HTMLElement.prototype, 'innerText', {
        configurable: true,
        get() {
            return this.textContent ?? '';
        },
        set(value: string) {
            this.textContent = value;
        },
    });
};

/** The app stylesheets are not loaded in jsdom: Proton modals render a
 * `<dialog>` without `[open]` and rely on their CSS to display it */
export const mockAppStyles = () => {
    if (document.getElementById('test-app-styles')) return;
    const style = document.createElement('style');
    style.id = 'test-app-styles';
    style.textContent = 'dialog:not([open]) { display: block; }';
    document.head.appendChild(style);
};
