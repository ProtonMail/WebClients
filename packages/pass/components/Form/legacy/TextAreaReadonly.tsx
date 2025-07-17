import type { FC, MouseEventHandler } from 'react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { repaint } from '@proton/pass/utils/dom/repaint';
import clsx from '@proton/utils/clsx';
import debounce from '@proton/utils/debounce';

import './TextAreaReadonly.scss';

type Props = { children: string; className?: string };
type ExpansionState = 'initial' | 'collapsed' | 'expanded';

/** Clamp to multiple of body's line-height to
 * prevent partial line cropping. */
const getMaxHeight = () => {
    const maxHeight = Math.max(window.innerHeight / 2, EXTENSION_BUILD ? 120 : 240);
    const computedStyle = window.getComputedStyle(document.body);
    const lineHeight = parseFloat(computedStyle.lineHeight);

    if (isNaN(lineHeight)) return maxHeight;
    else return Math.floor(maxHeight / lineHeight) * lineHeight;
};

export const TextAreaReadonly: FC<Props> = ({ children, className }) => {
    const ref = useRef<HTMLTextAreaElement>(null);
    const [scrollHeight, setScrollHeight] = useState(0);
    const [expansionState, setExpansionState] = useState<ExpansionState>('initial');
    const [maxHeight, setMaxHeight] = useState(getMaxHeight);

    const isExpanded = expansionState === 'expanded';
    const needsExpansion = scrollHeight > maxHeight;
    const shouldAnimate = expansionState !== 'initial';
    const height = !needsExpansion || isExpanded ? scrollHeight : maxHeight;

    const toggleExpansion = useCallback<MouseEventHandler>((evt) => {
        evt.preventDefault();
        evt.stopPropagation();
        setExpansionState((prev) => (prev === 'expanded' ? 'collapsed' : 'expanded'));
    }, []);

    const preventSelectionClick = useCallback<MouseEventHandler>((evt) => {
        if (ref.current) {
            const { selectionStart, selectionEnd } = ref.current;
            const hasSelection = selectionStart !== selectionEnd;
            if (hasSelection) {
                evt.preventDefault();
                evt.stopPropagation();
            }
        }
    }, []);

    useEffect(() => {
        const onResize = debounce(() => setMaxHeight(getMaxHeight), 50);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    useLayoutEffect(() => {
        if (ref.current) {
            /** Force layout repaint for accurate `scrollHeight` in Firefox */
            repaint(ref.current);
            const scrollHeight = ref.current.scrollHeight;
            setScrollHeight(scrollHeight);
        }
    }, [children, expansionState, maxHeight]);

    return (
        <>
            <textarea
                ref={ref}
                readOnly
                value={children}
                className={clsx(
                    'w-full h-full text-pre-wrap resize-none h-custom pass-textarea--readonly overflow-hidden',
                    shouldAnimate && 'pass-textarea--animate',
                    className
                )}
                style={{ '--h-custom': `${height}px` }}
                onClick={preventSelectionClick}
            />
            {needsExpansion && (
                <>
                    {!isExpanded && <span className="mr-1">...</span>}
                    <Button
                        pill
                        shape="underline"
                        className="link link-focus text-nowrap"
                        color="weak"
                        onClick={toggleExpansion}
                    >
                        <span className="line-height-1">
                            {isExpanded ? c('Action').t`Show Less` : c('Action').t`Read More`}
                        </span>
                    </Button>
                </>
            )}
        </>
    );
};
