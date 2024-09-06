import type { HTMLProps } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import clsx from '@proton/utils/clsx';

import { Tooltip } from '../tooltip';

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
}

const MiddleEllipsis = ({
    text,
    className = '',
    displayTitle = true,
    displayTooltip = false,
    charsToDisplayEnd = 6,
    direction = 'ltr',
    ...rest
}: Props) => {
    const [start, end] = useMemo(() => {
        // Split text per characters and not bytes. For example, 👋🌍😊🐶 with
        // charsToDisplayEnd=3 would end up being 👋🌍� and �🐶 with simple
        // string slice. With array slice (because string iterator iterates per
        // characters), the results is as expected 👋 and 🌍😊🐶.
        // Note this doesn't work with all unicodes. For example, flags have
        // six bytes and even that is not handled properly by string iterator.
        return [[...text].slice(0, -charsToDisplayEnd).join(''), [...text].slice(-charsToDisplayEnd).join('')];
    }, [text]);

    const ref = useRef<HTMLSpanElement>(null);
    const [tooltipTitle, setTooltipTitle] = useState<string | null>(null);
    useEffect(() => {
        if (!displayTooltip || !ref.current) {
            return;
        }
        const textIsTooLong = ref.current.offsetWidth < ref.current.scrollWidth;
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
                className={clsx(['inline-flex flex-nowrap max-w-full my-1', className])}
                dir={direction}
                {...rest}
            >
                {start && (
                    <span ref={ref} className="text-ellipsis text-pre" aria-hidden="true">
                        {start}
                    </span>
                )}

                <span className="shrink-0 text-pre" aria-hidden="true">
                    {end}
                </span>
            </span>
        </Tooltip>
    );
};

export default MiddleEllipsis;
