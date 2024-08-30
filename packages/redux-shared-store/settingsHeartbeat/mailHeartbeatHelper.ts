import {
    DELAY_IN_SECONDS,
    IMAGE_PROXY_FLAGS,
    MAIL_PAGE_SIZE,
    NEXT_MESSAGE_ON_MOVE,
    PACKAGE_TYPE,
    SWIPE_ACTION,
} from '@proton/shared/lib/mail/mailSettings';

export const getSwipeAction = (swipeAction: SWIPE_ACTION) => {
    switch (swipeAction) {
        case SWIPE_ACTION.Archive:
            return 'archive';
        case SWIPE_ACTION.MarkAsRead:
            return 'markAsRead';
        case SWIPE_ACTION.Spam:
            return 'spam';
        case SWIPE_ACTION.Star:
            return 'star';
        case SWIPE_ACTION.Trash:
            return 'trash';
    }
};
export const getPageSize = (pageSize: MAIL_PAGE_SIZE) => {
    switch (pageSize) {
        case MAIL_PAGE_SIZE.FIFTY:
            return '50';
        case MAIL_PAGE_SIZE.ONE_HUNDRED:
            return '100';
        case MAIL_PAGE_SIZE.TWO_HUNDRED:
            return '200';
    }
};

export const getDelaySecond = (delay: DELAY_IN_SECONDS) => {
    switch (delay) {
        case DELAY_IN_SECONDS.NONE:
            return '0';
        case DELAY_IN_SECONDS.SMALL:
            return '5';
        case DELAY_IN_SECONDS.MEDIUM:
            return '10';
        case DELAY_IN_SECONDS.LARGE:
            return '20';
    }
};

export const getNextMessageOnMove = (nextOnMove: NEXT_MESSAGE_ON_MOVE) => {
    switch (nextOnMove) {
        case NEXT_MESSAGE_ON_MOVE.DEFAULT:
            return 'default';
        case NEXT_MESSAGE_ON_MOVE.DISABLED:
            return 'disabled';
        case NEXT_MESSAGE_ON_MOVE.ENABLED:
            return 'enabled';
    }
};

export const getFontFace = (fontFace: string | null) => {
    if (!fontFace) {
        return 'arial';
    }

    return fontFace;
};

export const getFontSize = (fontSize: number | null) => {
    if (!fontSize) {
        return '14';
    }

    return fontSize.toString();
};

export const getPGPScheme = (pgpScheme: PACKAGE_TYPE) => {
    switch (pgpScheme) {
        case PACKAGE_TYPE.SEND_PGP_INLINE:
            return 'inline';
        case PACKAGE_TYPE.SEND_PGP_MIME:
            return 'mime';
        case PACKAGE_TYPE.SEND_CLEAR:
            return 'clear';
        case PACKAGE_TYPE.SEND_CLEAR_MIME:
            return 'clear-mime';
        case PACKAGE_TYPE.SEND_EO:
            return 'eo';
        case PACKAGE_TYPE.SEND_PM:
            return 'pm';
    }
};

export const imageProxy = (imageProxy: IMAGE_PROXY_FLAGS) => {
    switch (imageProxy) {
        case IMAGE_PROXY_FLAGS.NONE:
            return 'none';
        case IMAGE_PROXY_FLAGS.INCORPORATOR:
            return 'incoporator';
        case IMAGE_PROXY_FLAGS.PROXY:
            return 'proxy';
        case IMAGE_PROXY_FLAGS.ALL:
            return 'all';
    }
};

export const getAddressRange = (addresss?: any[]) => {
    if (!addresss) {
        return '0';
    }

    if (addresss.length < 10) {
        return addresss.length.toString();
    }

    return '10+';
};

export const getArrayLengthRange = (arr?: any[]) => {
    if (!arr) {
        return '0';
    }

    if (arr.length < 10) {
        return arr.length.toString();
    }

    if (arr.length < 20) {
        return '10-19';
    }

    if (arr.length < 50) {
        return '20-49';
    }

    return '50+';
};
