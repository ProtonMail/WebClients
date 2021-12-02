import { HTMLProps, useMemo, useEffect, useRef, useState } from 'react';
import { classnames } from '../../helpers';
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
        return [text.slice(0, -charsToDisplayEnd), text.slice(-charsToDisplayEnd)];
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
                className={classnames(['inline-flex flex-nowrap mw100', className])}
                dir={direction}
                {...rest}
            >
                {start && (
                    <span ref={ref} className="text-ellipsis text-pre" aria-hidden="true">
                        {start}
                    </span>
                )}

                <span className="flex-item-noshrink text-pre" aria-hidden="true">
                    {end}
                </span>
            </span>
        </Tooltip>
    );
};

export default MiddleEllipsis;
