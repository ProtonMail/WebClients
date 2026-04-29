/** Return true for internal url and false for any navigation outside the app. */
export const isMainWindowEntry = (url: string) => decodeURIComponent(url).startsWith(MAIN_WINDOW_WEBPACK_ENTRY);
