// jsdom does not let a test redefine window.location. reconfigure() is its supported way to change
// the URL, cross-origin included. A relative URL resolves against the current one.
exports.setLocation = (url) => globalThis.jsdom.reconfigure({ url: new URL(url, window.location.href).href });
