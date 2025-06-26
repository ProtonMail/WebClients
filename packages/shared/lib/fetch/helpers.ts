const appendQueryParams = (url: URL, params: { [key: string]: any }) => {
    Object.keys(params).forEach((key) => {
        const value = params[key];
        if (typeof value === 'undefined') {
            return;
        }

        if (Array.isArray(value)) {
            value.forEach((item) => {
                url.searchParams.append(`${key}[]`, item);
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
