export enum MESSAGE_ACTIONS {
    NEW = -1,
    REPLY = 0,
    REPLY_ALL = 1,
    FORWARD = 2,
}

export enum ENCRYPTED_STATUS {
    PGP_MIME = 8, // Used for attachment
}

export const LARGE_KEY_SIZE = 50 * 1024;

export const MESSAGE_IMAGE_ATTRIBUTES_TO_LOAD = ['url', 'xlink:href', 'src', 'svg', 'background', 'poster'];

export const PLACEHOLDER_ID_PREFIX = 'placeholder';
