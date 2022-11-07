import { RefObject, useEffect, useRef } from 'react';

import { MessageImages } from '../../logic/messages/messagesTypes';
import MessageBodyImage from './MessageBodyImage';

interface Props {
    messageImages: MessageImages | undefined;
    iframeRef: RefObject<HTMLIFrameElement>;
    isPrint: boolean;
    onImagesLoaded?: () => void;
}

const MessageBodyImages = ({ messageImages, iframeRef, isPrint, onImagesLoaded }: Props) => {
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
                      />
                  ))
                : null}
        </>
    );
};

export default MessageBodyImages;
