import type {
    MessageEmbeddedImage,
    MessageImages,
    MessageRemoteImage,
    PartialMessageState,
} from '@proton/mail/store/messages/messagesTypes';

export const getRemoteImages = ({ messageImages }: PartialMessageState) =>
    (messageImages?.images.filter(({ type }) => type === 'remote') || []) as MessageRemoteImage[];

export const getEmbeddedImages = ({ messageImages }: PartialMessageState) =>
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
            trackersStatus: 'not-loaded',
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
