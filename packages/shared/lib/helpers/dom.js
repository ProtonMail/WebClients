export const attachOnUnload = (cb) => {
    if (window.addEventListener) {
        return window.addEventListener('unload', cb, false);
    }

    if (window.attachEvent) {
        return window.attachEvent('onunload', cb);
    }

    throw new Error('No method for adding event listeners!');
};

const loadScriptHelper = ({ path, integrity }, cb) => {
    const script = document.createElement('script');

    script.src = path;
    if (integrity) {
        script.integrity = integrity;
    }
    script.onload = (e) => cb(e);
    script.onerror = (e) => cb(undefined, e);

    document.head.appendChild(script);
};

export const loadScript = (path, integrity) => {
    return new Promise((resolve, reject) => {
        loadScriptHelper({ path, integrity }, (event, error) => {
            if (error) {
                return reject(error);
            }
            return resolve();
        });
    });
};
