const appendQueryParams = (url: URL, params: { [key: string]: any }) => {
    Object.entries(params).forEach(([key, value]) => {
        if (typeof value === 'undefined') {
            return;
        }

        if (Array.isArray(value)) {
            value.forEach((item) => {
                // If the key already contains [], do not add it a second time or the request would be malformed
                if (key.endsWith('[]')) {
                    if (process.env.NODE_ENV !== 'production') {
                        console.warn(`Warning: Key "${key}" ends with "[]". Please use "${key.slice(0, -2)}" instead.`);
                    }
                    url.searchParams.append(key, item);
                } else {
                    url.searchParams.append(`${key}[]`, item);
                }
            });
        } else {
            url.searchParams.append(key, value);
        }
    });
};

export const createUrl = (urlString: string, params: { [key: string]: any } = {}, origin?: string) => {
    let url: URL;
    if (origin) {
        url = new URL(urlString, origin);
    } else {
        url = new URL(urlString);
    }
    appendQueryParams(url, params);
    return url;
};

export const getDateHeader = (headers: Headers) => {
    const dateHeader = headers?.get?.('date');
    if (!dateHeader) {
        return;
    }
    const newServerTime = new Date(dateHeader);
    if (Number.isNaN(+newServerTime)) {
        return;
    }
    return newServerTime;
};
