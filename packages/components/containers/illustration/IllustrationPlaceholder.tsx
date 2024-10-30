import type { ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

interface Props {
    className?: string;
    height?: number;
    illustrationClassName?: string;
    title?: string;
    url: string;
    uppercase?: boolean;
    children?: ReactNode;
    titleSize?: 'regular' | 'big';
}

const IllustrationPlaceholder = ({
    className,
    height,
    illustrationClassName,
    title,
    url,
    uppercase,
    children,
    titleSize = 'big',
}: Props) => {
    return (
        <div className={clsx('flex *:min-size-auto flex-column flex-nowrap items-center w-full', className)}>
            <img src={url} alt={title} className={clsx('p-1 mb-4', illustrationClassName)} height={height} />
            {!!title && (
                <h1
                    className={clsx(
                        'text-bold text-rg mb-1',
                        titleSize === 'regular' && 'text-rg',
                        titleSize === 'big' && 'text-4xl',
                        uppercase && 'text-uppercase'
                    )}
                >
                    {title}
                </h1>
            )}
            {children}
        </div>
    );
};

export default IllustrationPlaceholder;
