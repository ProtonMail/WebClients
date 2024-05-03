import { RefObject, useLayoutEffect, useState } from 'react';

import debounce from '@proton/utils/debounce';

type Props = Record<'composerContainerRef' | 'composerContentRef' | 'composerMetaRef', RefObject<HTMLElement>>;

const useComposerAssistantPosition = ({ composerContainerRef, composerContentRef, composerMetaRef }: Props) => {
    /** Compute the top value of the composer assistant */
    const computeTopValue = () => {
        const composerContentEditorCoord = composerContentRef.current?.getBoundingClientRect()?.y ?? 0;
        const composerContainerCoord = composerContainerRef.current?.getBoundingClientRect()?.y ?? 0;

        return composerContentEditorCoord - composerContainerCoord;
    };

    const [composerAssistantTopValue, setComposerAssistantTopValue] = useState(computeTopValue);

    useLayoutEffect(() => {
        if (!composerMetaRef.current) {
            return;
        }

        const debouncedComputeTopValue = debounce(
            () => {
                setComposerAssistantTopValue(computeTopValue());
            },
            100,
            {
                leading: true,
            }
        );

        const resizeObserver = new ResizeObserver(debouncedComputeTopValue);
        resizeObserver.observe(composerMetaRef.current);

        return () => {
            debouncedComputeTopValue.cancel();
            resizeObserver.disconnect();
        };
    }, []);

    return composerAssistantTopValue;
};

export default useComposerAssistantPosition;
