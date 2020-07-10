import React from 'react';
import { useKeyPress, NavigationControl } from 'react-components';
import { LinkMeta } from '../interfaces/link';

interface Props {
    openLinkId: string;
    availableLinks: LinkMeta[];
    onOpen?: (link: LinkMeta) => void;
}

function FilePreviewNavigation({ openLinkId, availableLinks, onOpen }: Props) {
    const totalAvailable = availableLinks.length;
    const currentOpenIndex = availableLinks.findIndex(({ LinkID }) => LinkID === openLinkId);

    const handleNext = () => currentOpenIndex < totalAvailable - 1 && onOpen?.(availableLinks[currentOpenIndex + 1]);
    const handlePrev = () => currentOpenIndex > 0 && onOpen?.(availableLinks[currentOpenIndex - 1]);

    useKeyPress(
        (e) => {
            if (currentOpenIndex !== -1 && e.key === 'ArrowLeft') {
                handlePrev();
            } else if (currentOpenIndex !== -1 && e.key === 'ArrowRight') {
                handleNext();
            }
        },
        [currentOpenIndex]
    );

    return (
        <>
            {onOpen && totalAvailable > 0 && currentOpenIndex !== -1 && (
                <NavigationControl
                    current={currentOpenIndex + 1}
                    total={totalAvailable}
                    onPrev={handlePrev}
                    onNext={handleNext}
                />
            )}
        </>
    );
}

export default FilePreviewNavigation;
