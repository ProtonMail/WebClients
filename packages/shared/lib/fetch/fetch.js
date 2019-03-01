import checkStatus from './checkStatus';

const fetchHelper = ({ url: urlString, params = {}, output, ...config }) => {
    const options = {
        mode: 'cors',
        credentials: 'include',
        redirect: 'follow',
        ...config
    };

    const url = new URL(urlString);
    Object.keys(params).forEach((key) => url.searchParams.append(key, params[key]));

    return fetch(url, options)
        .then(checkStatus)
        .then((response) => response[output]());
};

export const fetchJson = ({ data, headers, output = 'json', ...config }) => {
    const extraHeaders = data
        ? {
              'Content-Type': 'application/json'
          }
        : undefined;

    return fetchHelper({
        ...config,
        headers: {
            ...headers,
            ...extraHeaders
        },
        body: data ? JSON.stringify(data) : undefined,
        output
    });
};
