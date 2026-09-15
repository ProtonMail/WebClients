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