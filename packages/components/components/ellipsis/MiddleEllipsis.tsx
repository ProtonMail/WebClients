import { HTMLProps, useMemo } from 'react';
import { classnames } from '../../helpers';

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
     * Unless you REALLY know what you are doing (if you're using this component on RTL content ONLY for example)
     * leave this value to ltr, otherwise you can update it
     */
    direction?: string;
}

const MiddleEllipsis = ({
    text,
    className = '',
    displayTitle = true,
    charsToDisplayEnd = 6,
    direction = 'ltr',
    ...rest
}: Props) => {
    const [start, end] = useMemo(() => {
        return [text.slice(0, -charsToDisplayEnd), text.slice(-charsToDisplayEnd)];
    }, [text]);

    return (
        <span
            aria-label={text}
            title={displayTitle ? text : undefined}
            className={classnames(['inline-flex flex-nowrap mw100', className])}
            dir={direction}
            {...rest}
        >
            {start && (
                <span className="text-ellipsis text-pre" aria-hidden="true">
                    {start}
                </span>
            )}

            <span className="flex-item-noshrink text-pre" aria-hidden="true">
                {end}
            </span>
        </span>
    );
};

export default MiddleEllipsis;
