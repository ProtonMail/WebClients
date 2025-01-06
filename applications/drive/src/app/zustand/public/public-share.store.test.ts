import { act, renderHook } from '@testing-library/react';

import { SHARE_URL_PERMISSIONS } from '@proton/shared/lib/drive/permissions';

import type { DecryptedLink, SharedUrlInfo } from '../../store';
import { usePublicShareStore } from './public-share.store';

describe('usePublicShareStore', () => {
    describe('setPublicShare', () => {
        it('should set public share data and viewOnly true for viewer permissions', () => {
            const { result } = renderHook(() => usePublicShareStore());
            const mockPublicShare = {
                link: {
                    linkId: 'linkId',
                } as DecryptedLink,
                sharedUrlInfo: {
                    permissions: SHARE_URL_PERMISSIONS.VIEWER,
                } as SharedUrlInfo,
            };

            act(() => {
                result.current.setPublicShare(mockPublicShare);
            });

            expect(result.current.publicShare).toEqual(mockPublicShare);
            expect(result.current.viewOnly).toBe(true);
        });

        it('should set public share data and viewOnly false for editor permissions', () => {
            const { result } = renderHook(() => usePublicShareStore());
            const mockPublicShare = {
                link: {
                    linkId: 'linkId',
                } as DecryptedLink,
                sharedUrlInfo: {
                    permissions: SHARE_URL_PERMISSIONS.EDITOR,
                } as SharedUrlInfo,
            };

            act(() => {
                result.current.setPublicShare(mockPublicShare);
            });

            expect(result.current.publicShare).toEqual(mockPublicShare);
            expect(result.current.viewOnly).toBe(false);
        });

        it('should update existing public share data and viewOnly status', () => {
            const { result } = renderHook(() => usePublicShareStore());
            const initialPublicShare = {
                link: {
                    linkId: 'initialLinkId',
                } as DecryptedLink,
                sharedUrlInfo: {
                    permissions: SHARE_URL_PERMISSIONS.EDITOR,
                } as SharedUrlInfo,
            };
            const updatedPublicShare = {
                link: {
                    linkId: 'updatedLinkId',
                } as DecryptedLink,
                sharedUrlInfo: {
                    permissions: SHARE_URL_PERMISSIONS.VIEWER,
                } as SharedUrlInfo,
            };

            act(() => {
                result.current.setPublicShare(initialPublicShare);
            });

            expect(result.current.publicShare).toEqual(initialPublicShare);
            expect(result.current.viewOnly).toBe(false);

            act(() => {
                result.current.setPublicShare(updatedPublicShare);
            });

            expect(result.current.publicShare).toEqual(updatedPublicShare);
            expect(result.current.viewOnly).toBe(true);
        });
    });
});
