import { PHOTOS_PAGE_SIZE } from '../../drive/constants';
import { API_CUSTOM_ERROR_CODES } from '../../errors';
import type { PhotoTag } from '../../interfaces/drive/file';
import type { PhotoDataForAddToAlbumPayload } from '../../interfaces/drive/photos';

export const queryPhotos = (
    volumeId: string,
    {
        Tag,
        ...params
    }: {
        Desc?: 0 | 1;
        PreviousPageLastLinkID?: string;
        MinimumCaptureTime?: number;
        Tag?: PhotoTag;
    } = {}
) => ({
    method: 'get',
    url: `drive/volumes/${volumeId}/photos`,
    params: {
        PageSize: PHOTOS_PAGE_SIZE,
        ...params,
        // TODO: For now BE only accept one Tag, but it should support multiple.
        Tag: Tag,
    },
});

export const queryAlbums = (
    volumeId: string,
    params?: {
        AnchorID?: string;
    }
) => ({
    method: 'get',
    url: `drive/photos/volumes/${volumeId}/albums`,
    params: {
        ...params,
    },
});

export const querySharedWithMeAlbums = (params?: { AnchorID?: string }) => ({
    method: 'get',
    url: `drive/photos/albums/shared-with-me`,
    params,
});

export const queryUpdateAlbumCover = (
    volumeId: string,
    albumLinkId: string,
    data: {
        CoverLinkID?: string;
    }
) => ({
    method: 'PUT',
    url: `drive/photos/volumes/${volumeId}/albums/${albumLinkId}`,
    data,
});

export const queryUpdateAlbumName = (
    volumeId: string,
    albumLinkId: string,
    data: {
        Link: {
            Name: string;
            Hash: string;
            OriginalHash: string;
            NameSignatureEmail?: string;
        };
    }
) => ({
    method: 'PUT',
    url: `drive/photos/volumes/${volumeId}/albums/${albumLinkId}`,
    data,
});

export interface RelatedPhotos {
    LinkID: string;
    Hash: string;
    Name: string;
    NameSignatureEmail: string;
    NodePassphrase: string;
    ContentHash: string;
    NodePassphraseSignature?: string; // Required when moving an anonymous Node. It must be signed by the SignatureEmail address.
    SignatureEmail?: string; // Required when moving an anonymous Node. Email address used for the NodePassphraseSignature.
}

export interface FavoriteData {
    PhotoData?: {
        Hash: string;
        Name: string;
        NameSignatureEmail: string;
        NodePassphrase: string;
        ContentHash?: string;
        NodePassphraseSignature?: string; // Required when moving an anonymous Node. It must be signed by the SignatureEmail address.
        SignatureEmail?: string; // Required when moving an anonymous Node. Email address used for the NodePassphraseSignature.
        RelatedPhotos: RelatedPhotos[];
    };
}

export const queryAddPhotoToFavorite = (volumeId: string, linkId: string, data: FavoriteData) => ({
    method: 'POST',
    url: `drive/photos/volumes/${volumeId}/links/${linkId}/favorite`,
    data,
});

export const queryRemoveTagsFromPhoto = (
    volumeId: string,
    linkId: string,
    data: {
        Tags: PhotoTag[];
    }
) => ({
    method: 'DELETE',
    url: `drive/photos/volumes/${volumeId}/links/${linkId}/tags`,
    data,
});

export const queryAddAlbumPhotos = (
    volumeId: string,
    albumLinkId: string,
    data: {
        AlbumData: PhotoDataForAddToAlbumPayload[];
    }
) => ({
    method: 'POST',
    url: `drive/photos/volumes/${volumeId}/albums/${albumLinkId}/add-multiple`,
    data,
});

export const queryAlbumPhotos = (
    volumeId: string,
    albumLinkId: string,
    params?: {
        AnchorID?: string;
    }
) => ({
    method: 'get',
    url: `drive/photos/volumes/${volumeId}/albums/${albumLinkId}/children`,
    params: {
        ...params,
    },
});

export const queryDeletePhotosShare = (volumeId: string, shareId: string) => ({
    method: 'delete',
    url: `drive/volumes/${volumeId}/photos/share/${shareId}`,
});

export const queryPhotosDuplicates = (volumeId: string, { nameHashes }: { nameHashes: string[] }) => ({
    method: 'post',
    url: `drive/volumes/${volumeId}/photos/duplicates`,
    data: {
        NameHashes: nameHashes,
    },
});

export const queryCreateAlbum = (
    volumeId: string,
    data: {
        Locked: boolean;
        Link: {
            Name: string;
            Hash: string;
            NodePassphrase: string;
            NodePassphraseSignature: string;
            SignatureEmail: string;
            NodeKey: string;
            NodeHashKey: string;
            XAttr?: string;
        };
    }
) => ({
    method: 'post',
    url: `drive/photos/volumes/${volumeId}/albums`,
    data,
});

export const queryRemoveAlbumPhotos = (
    volumeId: string,
    albumLinkId: string,
    data: {
        LinkIDs: string[];
    }
) => ({
    method: 'POST',
    url: `drive/photos/volumes/${volumeId}/albums/${albumLinkId}/remove-multiple`,
    data,
});

export const queryDeleteAlbum = (
    volumeId: string,
    albumLinkId: string,
    params: { DeleteAlbumPhotos?: 0 | 1 } = {}
) => ({
    method: 'DELETE',
    url: `drive/photos/volumes/${volumeId}/albums/${albumLinkId}`,
    params,
    silence: [API_CUSTOM_ERROR_CODES.ALBUM_DATA_LOSS],
});
