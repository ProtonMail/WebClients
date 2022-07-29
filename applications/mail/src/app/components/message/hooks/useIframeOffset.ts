import { RefObject } from 'react';

import { IframeOffsetType } from '../interface';

const useIframeOffset = (iframeRef: RefObject<HTMLIFrameElement>): IframeOffsetType | undefined => {
    const iframeRect = iframeRef.current?.getBoundingClientRect();
    let iframeOffset: { x: number; y: number } | undefined;
    if (iframeRect?.x !== undefined && iframeRect?.y !== undefined) {
        iframeOffset = { x: iframeRect.x, y: iframeRect.y };
    }

    return iframeOffset;
};

export default useIframeOffset;
