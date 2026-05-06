import { useLayoutEffect, useState } from 'react';

interface Props {
    ref: React.RefObject<HTMLDivElement>;
}

export const useMailboxToolbarBreakpoints = ({ ref }: Props) => {
    const [containerWidth, setContainerWidth] = useState(Infinity);

    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) {
            return;
        }

        const observer = new ResizeObserver(([entry]) => {
            setContainerWidth(entry.contentRect.width);
        });

        observer.observe(el);

        return () => observer.disconnect();
    }, [ref]);

    // Derived breakpoints based on available toolbar width (not viewport width)
    const isTiny = containerWidth < 820;
    const isExtraTiny = containerWidth < 575;
    const filterAsDropdown = containerWidth < 1024;

    return { isTiny, isExtraTiny, filterAsDropdown };
};
