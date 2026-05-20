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
                        // eslint-disable-next-line no-console
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

const getValidDate = (dateHeader: string | null | undefined) => {
    if (!dateHeader) {
        return;
    }
    const newServerTime = new Date(dateHeader);
    if (Number.isNaN(+newServerTime)) {
        return;
    }
    return newServerTime;
};

export const getDateHeader = (headers?: Headers) => {
    const customDateHeader = headers?.get?.('x-pm-date');
    const standardDateHeader = headers?.get?.('date');

    return getValidDate(customDateHeader) ?? getValidDate(standardDateHeader);
};

export const getStandardAndCustomDateHeader = (headers?: Headers) => {
    const customDateHeader = headers?.get?.('x-pm-date');
    const standardDateHeader = headers?.get?.('date');

    const standardDate = getValidDate(standardDateHeader);
    const customDate = getValidDate(customDateHeader);

    return {
        standardDateHeader: standardDate && standardDate.toISOString(),
        customDateHeader: customDate && customDate.toISOString(),
    };
};
