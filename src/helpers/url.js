const getHostname = (url) => {
    if (/^https?:\/\//.test(url)) {
        // Absolute URL.
        // The easy way to parse an URL, is to create <a> element.
        // @see: https://gist.github.com/jlong/2428561
        const parser = document.createElement('a');
        parser.href = url;
        return parser.hostname;
    }
    return window.location.hostname; // Relative URL.
};

export const isExternal = (url) => window.location.hostname !== getHostname(url);
