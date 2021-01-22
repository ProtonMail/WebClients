import React, { useMemo } from 'react';
import { classnames } from '../../helpers';

interface Props extends React.HTMLProps<HTMLSpanElement> {
    text: string;
    charsToDisplayEnd?: number;
    className?: string;
    displayTitle?: Boolean; // when you embed it into something with title/tooltip, you might not want to display it
}

const MiddleEllipsis = ({ text, className = '', displayTitle = true, charsToDisplayEnd = 6, ...rest }: Props) => {
    const [start, end] = useMemo(() => {
        return [text.slice(0, -charsToDisplayEnd), text.slice(-charsToDisplayEnd)];
    }, [text]);

    return (
        <span
            aria-label={text}
            title={displayTitle ? text : undefined}
            className={classnames(['inline-flex flex-nowrap mw100', className])}
            {...rest}
        >
            <span className="ellipsis" aria-hidden="true">
                {start}
            </span>
            <span className="flex-item-noshrink" aria-hidden="true">
                {end}
            </span>
        </span>
    );
};

export default MiddleEllipsis;
