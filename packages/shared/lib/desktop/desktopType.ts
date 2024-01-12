/**
 * Electron injects an object in the window object
 * This object can then be used to communicate from the web app to the desktop app
 * This type can be used in any file that needs to communicate with the desktop app.
 *
 * The object is not put globally to avoid polluting the type and ensure that it is used only when needed.
 */
export type ProtonDesktopAPI = {
    updateNotification: (count: number) => void;
};
