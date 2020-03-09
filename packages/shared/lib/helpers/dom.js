const loadScriptHelper = ({ path, integrity }, cb) => {
    const script = document.createElement('script');

    script.src = path;
    if (integrity) {
        script.integrity = integrity;
    }
    script.onload = (e) => {
        cb(e);
        script.remove();
    };
    script.onerror = (e) => cb(undefined, e);

    document.head.appendChild(script);
};

export const loadScript = (path, integrity) => {
    return new Promise((resolve, reject) => {
        loadScriptHelper({ path, integrity }, (event, error) => {
            if (error) {
                return reject(error);
            }
            return resolve(event);
        });
    });
};
