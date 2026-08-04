import type { RefObject } from 'react';
import { useEffect, useRef } from 'react';

import type { MessageImages } from '@proton/mail/store/messages/messagesTypes';

import type { OnMessageImageLoadError } from 'proton-mail/components/message/interface';

import MessageBodyImage from './MessageBodyImage';

interface Props {
    messageImages: MessageImages | undefined;
    iframeRef: RefObject<HTMLIFrameElement>;
    isPrint: boolean;
    onImagesLoaded?: () => void;
    onMessageImageLoadError: OnMessageImageLoadError;
}

const MessageBodyImages = ({ messageImages, iframeRef, isPrint, onImagesLoaded, onMessageImageLoadError }: Props) => {
    const hasTriggeredLoaded = useRef<boolean>(false);

    useEffect(() => {
        if (!hasTriggeredLoaded.current && messageImages?.images.every((img) => img.status === 'loaded')) {
            onImagesLoaded?.();
            hasTriggeredLoaded.current = true;
        }
    }, [messageImages?.images]);

    return (
        <>
            {messageImages
                ? messageImages.images.map((image) => (
                      <MessageBodyImage
                          key={image.id}
                          iframeRef={iframeRef}
                          showRemoteImages={messageImages?.showRemoteImages || false}
                          showEmbeddedImages={messageImages?.showEmbeddedImages || false}
                          image={image}
                          isPrint={isPrint}
                          onMessageImageLoadError={onMessageImageLoadError}
                      />
                  ))
                : null}
        </>
    );
};

export default MessageBodyImages;
