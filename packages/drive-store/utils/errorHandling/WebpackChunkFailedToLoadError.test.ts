import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';

import { WebpackChunkFailedToLoad, getWebpackChunkFailedToLoadError } from './WebpackChunkFailedToLoadError';

describe('getWebpackChunkFailedToLoadError', () => {
    it('returns a new instance of WebpackChunkFailedToLoad with the specified message and additional information', () => {
        const e = new Error('Underlying error');
        const chunkName = 'my-chunk-name';
        const result = getWebpackChunkFailedToLoadError(e, chunkName);
        expect(result).toBeInstanceOf(WebpackChunkFailedToLoad);
        expect(result.message).toBe(`${DRIVE_APP_NAME} has updated. Please refresh the page.`);
        // @ts-ignore
        expect(result.context.tags.chunkName).toBe(chunkName);
        // @ts-ignore
        expect(result.context.extra.e).toBe(e);
    });

    it('returns a new instance of WebpackChunkFailedToLoad with the default message and additional information', () => {
        const e = new Error('Underlying error');
        const result = getWebpackChunkFailedToLoadError(e, 'default-chunk-name');
        expect(result).toBeInstanceOf(WebpackChunkFailedToLoad);
        expect(result.message).toBe('Proton Drive has updated. Please refresh the page.');
    });
});

describe('WebpackChunkFailedToLoad', () => {
    it('calls the EnrichedError constructor with the specified message and context', () => {
        const message = 'Custom message';
        const context = { tags: { foo: 'bar' } };
        const error = new WebpackChunkFailedToLoad(message, context);
        expect(error.message).toBe(message);
    });
});
