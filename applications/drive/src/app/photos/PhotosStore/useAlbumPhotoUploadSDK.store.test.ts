import { act, renderHook } from '@testing-library/react';

import { useAlbumPhotoUploadSDKStore } from './useAlbumPhotoUploadSDK.store';

describe('useAlbumPhotoUploadSDKStore', () => {
    beforeEach(() => {
        const { result } = renderHook(() => useAlbumPhotoUploadSDKStore());
        act(() => {
            result.current.clear();
        });
    });

    it('should set and get upload context', () => {
        const { result } = renderHook(() => useAlbumPhotoUploadSDKStore());

        act(() => {
            result.current.setContext('upload-1', {
                albumShareId: 'share-1',
                albumLinkId: 'link-1',
                isOwner: true,
            });
        });

        const context = result.current.getContext('upload-1');
        expect(context).toEqual({
            albumShareId: 'share-1',
            albumLinkId: 'link-1',
            isOwner: true,
        });
    });

    it('should return undefined for non-existent upload', () => {
        const { result } = renderHook(() => useAlbumPhotoUploadSDKStore());

        const context = result.current.getContext('non-existent');
        expect(context).toBeUndefined();
    });

    it('should delete upload context', () => {
        const { result } = renderHook(() => useAlbumPhotoUploadSDKStore());

        act(() => {
            result.current.setContext('upload-1', {
                albumShareId: 'share-1',
                albumLinkId: 'link-1',
                isOwner: true,
            });
        });

        expect(result.current.getContext('upload-1')).toBeDefined();

        act(() => {
            result.current.deleteContext('upload-1');
        });

        expect(result.current.getContext('upload-1')).toBeUndefined();
    });

    it('should track pending uploads correctly', () => {
        const { result } = renderHook(() => useAlbumPhotoUploadSDKStore());

        expect(result.current.hasPendingUploads()).toBe(false);

        act(() => {
            result.current.setContext('upload-1', {
                albumShareId: 'share-1',
                albumLinkId: 'link-1',
                isOwner: true,
            });
        });

        expect(result.current.hasPendingUploads()).toBe(true);

        act(() => {
            result.current.setContext('upload-2', {
                albumShareId: 'share-2',
                albumLinkId: 'link-2',
                isOwner: false,
            });
        });

        expect(result.current.hasPendingUploads()).toBe(true);

        act(() => {
            result.current.deleteContext('upload-1');
        });

        expect(result.current.hasPendingUploads()).toBe(true);

        act(() => {
            result.current.deleteContext('upload-2');
        });

        expect(result.current.hasPendingUploads()).toBe(false);
    });

    it('should clear all contexts', () => {
        const { result } = renderHook(() => useAlbumPhotoUploadSDKStore());

        act(() => {
            result.current.setContext('upload-1', {
                albumShareId: 'share-1',
                albumLinkId: 'link-1',
                isOwner: true,
            });
            result.current.setContext('upload-2', {
                albumShareId: 'share-2',
                albumLinkId: 'link-2',
                isOwner: false,
            });
        });

        expect(result.current.hasPendingUploads()).toBe(true);

        act(() => {
            result.current.clear();
        });

        expect(result.current.hasPendingUploads()).toBe(false);
        expect(result.current.getContext('upload-1')).toBeUndefined();
        expect(result.current.getContext('upload-2')).toBeUndefined();
    });

    it('should handle multiple contexts independently', () => {
        const { result } = renderHook(() => useAlbumPhotoUploadSDKStore());

        act(() => {
            result.current.setContext('upload-1', {
                albumShareId: 'share-1',
                albumLinkId: 'link-1',
                isOwner: true,
            });
            result.current.setContext('upload-2', {
                albumShareId: 'share-2',
                albumLinkId: 'link-2',
                isOwner: false,
            });
        });

        const context1 = result.current.getContext('upload-1');
        const context2 = result.current.getContext('upload-2');

        expect(context1?.albumShareId).toBe('share-1');
        expect(context1?.isOwner).toBe(true);
        expect(context2?.albumShareId).toBe('share-2');
        expect(context2?.isOwner).toBe(false);
    });
});
