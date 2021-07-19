import {
    MessageEmbeddedImage,
    MessageImage,
    MessageImages,
    MessageRemoteImage,
    PartialMessageExtended,
} from '../../models/message';
import { ATTRIBUTES } from '../transforms/transformRemote';

const REGEXP_FIXER = (() => {
    const str = ATTRIBUTES.map((key) => `proton-${key}`).join('|');
    return `(${str})`;
})();

export const getAnchor = (document: Element | null | undefined, image: MessageImage) => {
    if (!document) {
        return null;
    }

    return document.querySelector(
        `.proton-image-anchor[data-proton-${image.type}="${image.id}"]`
    ) as HTMLElement | null;
};

export const getRemoteImages = ({ messageImages }: PartialMessageExtended) =>
    (messageImages?.images.filter(({ type }) => type === 'remote') || []) as MessageRemoteImage[];

export const getEmbeddedImages = ({ messageImages }: PartialMessageExtended) =>
    (messageImages?.images.filter(({ type }) => type === 'embedded') || []) as MessageEmbeddedImage[];

export const updateImages = (
    original: MessageImages | undefined,
    flagChanges: Partial<Omit<MessageImages, 'images'>> | undefined,
    remoteImages: MessageRemoteImage[] | undefined,
    embeddedImages: MessageEmbeddedImage[] | undefined
): MessageImages => {
    const messageImages: MessageImages = {
        ...{
            hasRemoteImages: false,
            hasEmbeddedImages: false,
            showRemoteImages: false,
            showEmbeddedImages: false,
            images: [],
        },
        ...(original || {}),
        ...(flagChanges || {}),
    };
    const remotes = getRemoteImages({ messageImages });
    const embeddeds = getEmbeddedImages({ messageImages });
    const images = [
        ...(remoteImages !== undefined ? remoteImages : remotes),
        ...(embeddedImages !== undefined ? embeddedImages : embeddeds),
    ];
    return { ...messageImages, images };
};

export const insertImageAnchor = (id: string, type: 'remote' | 'embedded', match: HTMLElement): string => {
    const anchor = document.createElement('span');
    anchor.classList.add('proton-image-anchor', 'inline-block');
    anchor.setAttribute(`data-proton-${type}`, id);
    match.parentElement?.replaceChild(anchor, match);
    return id;
};

export const restoreImages = (inputDocument: Element | undefined, images: MessageImages | undefined) => {
    if (!inputDocument || !images) {
        return inputDocument;
    }

    const document = inputDocument.cloneNode(true) as Element;
    const { showEmbeddedImages, showRemoteImages } = images;

    images.images.forEach((image) => {
        const anchor = getAnchor(document, image);
        const parent = anchor?.parentElement;
        const { original } = image;
        if (!anchor || !parent || !original) {
            return;
        }
        if (image.type === 'embedded') {
            original.setAttribute('data-embedded-img', image.cid);
            original.classList.add('proton-embedded');

            if (showEmbeddedImages) {
                original.setAttribute('src', image?.url || '');
            }
        }
        if (image.type === 'remote') {
            if (showRemoteImages) {
                original.setAttribute('src', image?.url || '');
            }
        }
        parent.replaceChild(original, anchor);
    });

    return document;
};

/**
 * Restore all prefixed attributes
 */
export const restoreAllPrefixedAttributes = (content: string) => {
    const regex = new RegExp(REGEXP_FIXER, 'g');
    return content.replace(regex, (_, $1) => $1.substring(7));
};
