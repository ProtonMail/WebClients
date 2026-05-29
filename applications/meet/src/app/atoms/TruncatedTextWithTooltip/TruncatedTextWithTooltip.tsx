import { useEffect, useRef, useState } from 'react';

import { ConditionalTooltip } from '../../components/ConditionalTooltip/ConditionalTooltip';

import './TruncatedTextWithTooltip.scss';

export const TruncatedTextWithTooltip = ({ label }: { label: string }) => {
    const spanRef = useRef<HTMLSpanElement>(null);
    const [isTruncated, setIsTruncated] = useState(false);

    const checkTruncation = () => {
        const el = spanRef.current;

        if (!el || !el.firstChild) {
            return;
        }

        const range = document.createRange();
        range.selectNodeContents(el);

        const rects = range.getClientRects();

        let textWidth = 0;
        for (let i = 0; i < rects.length; i++) {
            textWidth += rects[i].width;
        }

        setIsTruncated(textWidth > el.getBoundingClientRect().width);
    };

    useEffect(() => {
        const el = spanRef.current;
        if (!el) {
            return;
        }
        const observer = new ResizeObserver(checkTruncation);
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        checkTruncation();
    }, [label]);

    return (
        <ConditionalTooltip
            title={isTruncated ? label : undefined}
            placement="top"
            closeDelay={0}
            tooltipClassName="meet-tooltip bg-strong color-norm"
            tooltipStyle={{ '--meet-tooltip-bg': 'var(--interaction-norm-minor-2)' }}
        >
            <span ref={spanRef} className="truncated-text-with-tooltip text-ellipsis">
                {label}
            </span>
        </ConditionalTooltip>
    );
};
