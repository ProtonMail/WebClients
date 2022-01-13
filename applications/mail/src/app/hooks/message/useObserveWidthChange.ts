import { RefObject, useEffect, useRef } from 'react';
import { debouncedSetIframeHeight } from '../../components/message/helpers/setIframeHeight';

const useObserveWidthChange = (elRef: RefObject<HTMLElement>, iframeRef: RefObject<HTMLIFrameElement>) => {
    const prevWidthRef = useRef<number | undefined>(elRef.current?.offsetWidth);

    useEffect(() => {
        if (!elRef.current) {
            return;
        }

        const observer = new ResizeObserver((entries) => {
            const elEntry = entries.find((entry) => entry.target === elRef.current);
            const width = elEntry?.borderBoxSize.map((size) => size.inlineSize)[0];

            if (!width) {
                return;
            }

            const roundedWidth = Math.round(width);
            const hasResized = roundedWidth !== prevWidthRef.current;

            if (hasResized) {
                debouncedSetIframeHeight(iframeRef);
            }

            prevWidthRef.current = roundedWidth;
        });

        observer.observe(elRef.current);

        return () => {
            observer.disconnect();
        };
    }, []);
};

export default useObserveWidthChange;
