import { act, renderHook } from '@testing-library/react';

import { useAnonymousUploadAuthStore } from './anonymous-auth.store';

const linkId = 'mockLinkId';
const authToken = 'mockAuthToken';

describe('useAnonymousUploadAuthStore', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('setUploadToken', () => {
        it('should set a new upload token', () => {
            const { result } = renderHook(() => useAnonymousUploadAuthStore());

            act(() => {
                result.current.setUploadToken({
                    linkId,
                    authorizationToken: authToken,
                });
            });

            expect(result.current.uploadTokens.get(linkId)).toBe(authToken);
        });

        it('should remove token after expiration time', () => {
            const { result } = renderHook(() => useAnonymousUploadAuthStore());

            act(() => {
                result.current.setUploadToken({
                    linkId,
                    authorizationToken: authToken,
                });
            });

            expect(result.current.uploadTokens.get(linkId)).toBe(authToken);

            act(() => {
                jest.advanceTimersByTime(59 * 60 * 1000); // Fast-forward time by 59 minutes
            });

            expect(result.current.uploadTokens.has(linkId)).toBeFalsy();
        });
    });

    describe('removeUploadTokens', () => {
        it('should remove a single token', () => {
            const { result } = renderHook(() => useAnonymousUploadAuthStore());

            act(() => {
                result.current.setUploadToken({
                    linkId,
                    authorizationToken: authToken,
                });
            });

            act(() => {
                result.current.removeUploadTokens(linkId);
            });

            expect(result.current.uploadTokens.has(linkId)).toBeFalsy();
        });

        it('should remove multiple tokens', () => {
            const { result } = renderHook(() => useAnonymousUploadAuthStore());
            const tokens = [
                { linkId: 'id1', authToken: 'token1' },
                { linkId: 'id2', authToken: 'token2' },
                { linkId: 'id3', authToken: 'token3' },
            ];

            tokens.forEach(({ linkId, authToken }) => {
                act(() => {
                    result.current.setUploadToken({
                        linkId,
                        authorizationToken: authToken,
                    });
                });
            });

            act(() => {
                result.current.removeUploadTokens(['id1', 'id2']);
            });

            expect(result.current.uploadTokens.has('id1')).toBeFalsy();
            expect(result.current.uploadTokens.has('id2')).toBeFalsy();
            expect(result.current.uploadTokens.has('id3')).toBeTruthy();
            expect(result.current.uploadTokens.get('id3')).toBe('token3');
        });
    });
});
