import React, { ReactNode } from 'react';
import { classnames } from '../../helpers';

interface Props {
    className?: string;
    title?: string;
    url: string;
    uppercase?: boolean;
    children?: ReactNode;
}

const IllustrationPlaceholder = ({ className, title, url, uppercase, children }: Props) => {
    return (
        <div
            className={classnames([
                'flex-no-min-children flex-column flex-nowrap flex-align-items-center w100',
                className,
            ])}
        >
            <img src={url} alt={title} className="p1 mb1" />
            <h2 className={classnames(['text-bold', uppercase && 'text-uppercase'])}>{title}</h2>
            {children}
        </div>
    );
};

export default IllustrationPlaceholder;
