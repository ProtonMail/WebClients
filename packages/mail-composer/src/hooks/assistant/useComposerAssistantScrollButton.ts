import type { RefObject } from 'react';
import { useState } from 'react';

import throttle from 'lodash/throttle';

import { scrollIntoView } from '@proton/shared/lib/helpers/dom';

interface Props {
    assistantResultRef: RefObject<HTMLElement>;
    assistantResultChildRef: RefObject<HTMLElement>;
}

const useComposerAssistantScrollButton = ({ assistantResultRef, assistantResultChildRef }: Props) => {
    const [showArrow, setShowArrow] = useState(false);

    const checkScrollButtonDisplay = throttle(() => {
        if (!assistantResultRef?.current) {
            return false;
        }

        const resultScrollHeight = assistantResultRef.current.scrollHeight;
        // For some reason scroll top has decimal values but not scroll height or client height. So we need to round the value
        const resultScrollTop = Math.round(assistantResultRef.current.scrollTop);
        const resultClientHeight = assistantResultRef.current.clientHeight;

        const shouldShowArrowButton = resultScrollHeight - resultScrollTop !== resultClientHeight;

        setShowArrow(shouldShowArrowButton);
    }, 250);

    const handleScrollToBottom = () => {
        scrollIntoView(assistantResultChildRef.current, { behavior: 'smooth', block: 'end' });
        setShowArrow(false);
    };

    return { showArrow, checkScrollButtonDisplay, handleScrollToBottom };
};

export default useComposerAssistantScrollButton;
