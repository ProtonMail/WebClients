/**
 * Changes the URL of the happy-dom window, cross-origin included (Vitest counterpart of `@proton/jest-env/setLocation`).
 * A relative URL resolves against the current one.
 */
export const setLocation = (url: string): void => {
    const { happyDOM } = window as unknown as { happyDOM: { setURL: (url: string) => void } };
    happyDOM.setURL(new URL(url, window.location.href).href);
};
