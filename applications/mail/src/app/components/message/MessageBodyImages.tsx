import { RefObject } from 'react';

import MessageBodyImage from './MessageBodyImage';

import { MessageImages } from '../../logic/messages/messagesTypes';
import { IframeOffsetType } from './interface';

interface Props {
    messageImages: MessageImages | undefined;
    iframeRef: RefObject<HTMLIFrameElement>;
    isPrint: boolean;
    iframeOffset: IframeOffsetType | undefined;
}

const MessageBodyImages = ({ messageImages, iframeRef, isPrint, iframeOffset }: Props) => (
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

export default MessageBodyImages;
