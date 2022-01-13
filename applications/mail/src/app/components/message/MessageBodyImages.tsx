import { RefObject, useEffect, useRef } from 'react';

import MessageBodyImage from './MessageBodyImage';

import { MessageImages } from '../../logic/messages/messagesTypes';
import { IframeOffsetType } from './interface';
import { debouncedSetIframeHeight } from './helpers/setIframeHeight';

interface Props {
    messageImages: MessageImages | undefined;
    iframeRef: RefObject<HTMLIFrameElement>;
    isPrint: boolean;
    iframeOffset: IframeOffsetType | undefined;
}

const MessageBodyImages = ({ messageImages, iframeRef, isPrint, iframeOffset }: Props) => {
    const hasTriggeredLoaded = useRef<boolean>(false);

    useEffect(() => {
        if (!hasTriggeredLoaded.current && messageImages?.images.every((img) => img.status === 'loaded')) {
            debouncedSetIframeHeight(iframeRef);
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
                          iframePosition={iframeOffset}
                          isPrint={isPrint}
                      />
                  ))
                : null}
        </>
    );
};

export default MessageBodyImages;
