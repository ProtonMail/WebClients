import { createUrl, checkStatus } from './helpers';

const fetchHelper = ({ url: urlString, params, output, ...rest }) => {
    const config = {
        mode: 'cors',
        credentials: 'include',
        redirect: 'follow',
        ...rest
    };

    const url = createUrl(urlString, params);

    return fetch(url, config)
        .then((response) => checkStatus(response, config))
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
