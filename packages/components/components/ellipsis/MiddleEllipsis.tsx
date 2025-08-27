import type { HTMLProps } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Tooltip } from '@proton/atoms';
import clsx from '@proton/utils/clsx';

interface Props extends HTMLProps<HTMLSpanElement> {
    text: string;
    /**
     * number of characters you want to keep at the end: 6 will give “blablabla…bla.bla’”
     */
    charsToDisplayEnd?: number;
    className?: string;
    /**
     * when you embed it into something with title/tooltip, you might not want to display it
     */
    displayTitle?: Boolean;
    /**
     * When text is too long, tooltip can be used to show the full text.
     */
    displayTooltip?: Boolean;
    /**
     * Unless you REALLY know what you are doing (if you're using this component on RTL content ONLY for example)
     * leave this value to ltr, otherwise you can update it
     */
    direction?: string;
    /**
     * By default text without ellipsis is also split in two parts.
     * Set this to true to get a single DOM element when no ellipsis is needed.
     */
    splitOnlyTooLong?: boolean;
}

const MiddleEllipsis = ({
    text,
    className = '',
    displayTitle = true,
    displayTooltip = false,
    charsToDisplayEnd = 6,
    direction = 'ltr',
    splitOnlyTooLong = false,
    ...rest
}: Props) => {
    const ref = useRef<HTMLSpanElement>(null);
    const textIsTooLong = ref.current ? ref.current.offsetWidth < ref.current.scrollWidth : false;

    const [start, end] = useMemo(() => {
        // Split text per characters and not bytes. For example, 👋🌍😊🐶 with
        // charsToDisplayEnd=3 would end up being 👋🌍� and �🐶 with simple
        // string slice. With array slice (because string iterator iterates per
        // characters), the results is as expected 👋 and 🌍😊🐶.
        // Note this doesn't work with all unicodes. For example, flags have
        // six bytes and even that is not handled properly by string iterator.
        if (charsToDisplayEnd === 0 || (splitOnlyTooLong && textIsTooLong === false)) {
            return [text, null];
        }
        return [[...text].slice(0, -charsToDisplayEnd).join(''), [...text].slice(-charsToDisplayEnd).join('')];
    }, [text, textIsTooLong]);

    const [tooltipTitle, setTooltipTitle] = useState<string | null>(null);
    useEffect(() => {
        if (!displayTooltip || !ref.current) {
            return;
        }
        if (textIsTooLong) {
            setTooltipTitle(text);
        } else {
            setTooltipTitle(null);
        }
    });

    return (
        <Tooltip title={tooltipTitle} originalPlacement="bottom">
            <span
                aria-label={text}
                title={displayTitle ? text : undefined}
                className={clsx(['inline-flex flex-nowrap max-w-full', className])}
                dir={direction}
                {...rest}
            >
                <span ref={ref} className="text-ellipsis text-pre" aria-hidden="true">
                    {start}
                </span>

                {end && (
                    <span className="shrink-0 text-pre" aria-hidden="true">
                        {end}
                    </span>
                )}
            </span>
        </Tooltip>
    );
};

export default MiddleEllipsis;
