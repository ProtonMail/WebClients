import type { MutableRefObject } from 'react';

import type { MessageImage } from 'proton-mail/store/messages/messagesTypes';

export type OnMessageImageLoadError = (
    image: MessageImage,
    hasLoadedAfterErrorRef: MutableRefObject<{
        hasLoadedProxy: boolean;
        hasLoadedDirect: boolean;
    }>
) => Promise<void>;
