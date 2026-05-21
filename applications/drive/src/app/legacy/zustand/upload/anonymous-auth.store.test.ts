import { act, renderHook, waitFor } from '@testing-library/react';

import { useAnonymousUploadAuthStore } from './anonymous-auth.store';

const linkId = 'mockLinkId';
const authToken = 'mockAuthToken';

describe('useAnonymousUploadAuthStore', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.spyOn(Date, 'now').mockImplementation(() => 0);
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.spyOn(Date, 'now').mockRestore();
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

            expect(result.current.getUploadToken(linkId)).toBe(authToken);
        });

        it('should remove token after expiration time', async () => {
            const { result } = renderHook(() => useAnonymousUploadAuthStore());

            jest.spyOn(Date, 'now').mockReturnValue(0);

            act(() => {
                result.current.setUploadToken({
                    linkId,
                    authorizationToken: authToken,
                });
            });

            expect(result.current.getUploadToken(linkId)).toBe(authToken);

            jest.spyOn(Date, 'now').mockReturnValue(59 * 60 * 1000 + 1); // Fast-forward time by 59 minutes + 1 seconds

            await waitFor(() => expect(result.current.hasUploadToken(linkId)).toBeFalsy());
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

            expect(result.current.hasUploadToken(linkId)).toBeFalsy();
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

            expect(result.current.hasUploadToken('id1')).toBeFalsy();
            expect(result.current.hasUploadToken('id2')).toBeFalsy();
            expect(result.current.hasUploadToken('id3')).toBeTruthy();
            expect(result.current.getUploadToken('id3')).toBe('token3');
        });
    });
});
