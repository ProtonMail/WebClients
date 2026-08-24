import type { FC, MouseEventHandler } from 'react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import debounce from 'lodash/debounce';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import clsx from '@proton/utils/clsx';

import { repaint } from '../../../utils/dom/repaint';

import './TextAreaReadonly.scss';

type Props = {
    children: string;
    className?: string;
    defaultExpanded?: boolean;
    expanded?: boolean;
    onExpandedChange?: (expanded: boolean) => void;
};
type ExpansionState = 'initial' | 'collapsed' | 'expanded';

/** Treat `'initial'` as expanded when `defaultExpanded` so the very first
 * render never carries the animate class (avoids a mount-time transition). */
const isStateExpanded = (state: ExpansionState, defaultExpanded: boolean) =>
    state === 'expanded' || (state === 'initial' && defaultExpanded);

const MIN_HEIGHT = EXTENSION_BUILD ? 120 : 240;
/** Must match the `transition` duration on `.pass-textarea--animate`. */
const ANIMATION_DURATION_MS = 300;

/** Clamp to multiple of body's line-height to
 * prevent partial line cropping. */
const getMaxHeight = () => {
    const maxHeight = Math.max(window.innerHeight / 2, MIN_HEIGHT);
    const computedStyle = window.getComputedStyle(document.body);
    const lineHeight = parseFloat(computedStyle.lineHeight);

    if (isNaN(lineHeight)) return maxHeight;
    else return Math.floor(maxHeight / lineHeight) * lineHeight;
};

export const TextAreaReadonly: FC<Props> = ({
    children,
    className,
    defaultExpanded = false,
    expanded,
    onExpandedChange,
}) => {
    const ref = useRef<HTMLTextAreaElement>(null);
    const [scrollHeight, setScrollHeight] = useState(0);
    const [internalExpansionState, setInternalExpansionState] = useState<ExpansionState>('initial');
    const [maxHeight, setMaxHeight] = useState(getMaxHeight);
    /** Only true for the duration of a user-triggered expand/collapse
     * transition — background `maxHeight` recomputes (from resize)
     * must never carry the animate class, or a resize in progress
     * restarts the CSS transition every debounce tick, producing a
     * stuttering, multi-stage animation instead of a smooth one. */
    const [isToggling, setIsToggling] = useState(false);

    const isControlled = expanded !== undefined;
    const controlledExpansionState: ExpansionState = expanded ? 'expanded' : 'collapsed';
    const expansionState: ExpansionState = isControlled ? controlledExpansionState : internalExpansionState;

    const isExpanded = isStateExpanded(expansionState, defaultExpanded);
    const needsExpansion = scrollHeight > maxHeight;
    const height = !needsExpansion || isExpanded ? scrollHeight : maxHeight;

    const toggleExpansion = useCallback<MouseEventHandler>(
        (evt) => {
            evt.preventDefault();
            evt.stopPropagation();
            setIsToggling(true);
            const next = !isExpanded;
            if (isControlled) onExpandedChange?.(next);
            else setInternalExpansionState(next ? 'expanded' : 'collapsed');
        },
        [isControlled, isExpanded, onExpandedChange]
    );

    useEffect(() => {
        if (!isToggling) return;
        const timeout = setTimeout(() => setIsToggling(false), ANIMATION_DURATION_MS);
        return () => clearTimeout(timeout);
    }, [isToggling]);

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
        return () => {
            onResize.cancel();
            window.removeEventListener('resize', onResize);
        };
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
                    isToggling && 'pass-textarea--animate',
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
