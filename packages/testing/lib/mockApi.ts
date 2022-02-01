import { jest } from '@jest/globals';
import fetch from 'cross-fetch';

function handleResponse(response: Response) {
    return response.text().then((text) => {
        const data = text && JSON.parse(text);

        if (!response.ok) {
            const error = (data && data.message) || response.statusText;
            return Promise.reject(error);
        }

        return data;
    });
}

export const mockApi = jest.fn((config: any) => {
    const url = new URL(`http://localhost/${config.url}`);

    if (config.params) {
        url.search = new URLSearchParams(config.params).toString();
    }

    return fetch(url.toString(), {
        method: config.method,
    }).then(handleResponse);
});
