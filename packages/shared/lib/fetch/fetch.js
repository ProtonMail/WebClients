import { createUrl, checkStatus, checkDateHeader, serializeData } from './helpers';

const DEFAULT_TIMEOUT = 30000;

const fetchHelper = ({ url: urlString, params, output, signal, timeout = DEFAULT_TIMEOUT, ...rest }) => {
    const abortController = new AbortController();

    const config = {
        mode: 'cors',
        credentials: 'include',
        redirect: 'follow',
        signal: abortController.signal,
        ...rest
    };

    const url = createUrl(urlString, params);

    // Will reject the promise with DOMException (e.name = 'AbortError') after timeout
    const timeoutHandle = setTimeout(() => abortController.abort(), timeout);

    if (signal) {
        signal.addEventListener('abort', () => {
            abortController.abort();
            clearTimeout(timeoutHandle);
        });
    }

    return fetch(url, config)
        .then((response) => {
            clearTimeout(timeoutHandle);
            return checkStatus(response, config);
        })
        .then(checkDateHeader)
        .then((response) => response[output]());
};

export default ({ data, headers, input = 'json', output = 'json', ...config }) => {
    const { headers: dataHeaders, body } = serializeData(data, input);

    return fetchHelper({
        ...config,
        headers: {
            ...headers,
            ...dataHeaders
        },
        body,
        output
    });
};
