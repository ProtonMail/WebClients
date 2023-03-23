import { ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

interface Props {
    className?: string;
    illustrationClassName?: string;
    title?: string;
    url: string;
    uppercase?: boolean;
    children?: ReactNode;
}

const IllustrationPlaceholder = ({ className, illustrationClassName, title, url, uppercase, children }: Props) => {
    return (
        <div className={clsx('flex-no-min-children flex-column flex-nowrap flex-align-items-center w100', className)}>
            <img src={url} alt={title} className={clsx('p1 mb1', illustrationClassName)} />
            {!!title && <h1 className={clsx('text-bold h2 mb0-25', uppercase && 'text-uppercase')}>{title}</h1>}
            {children}
        </div>
    );
};

export default IllustrationPlaceholder;
