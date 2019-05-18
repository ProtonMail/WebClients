import { createUrl, checkStatus, checkDateHeader, serializeData } from './helpers';

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
