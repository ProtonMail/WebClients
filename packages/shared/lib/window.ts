/*
 * Need to keep a reference of the window object so that we can mock it during unit tests.
 * In order to avoid breaking non-window contexts (ie: service workers) expose the globalThis object
 */
export default globalThis;
