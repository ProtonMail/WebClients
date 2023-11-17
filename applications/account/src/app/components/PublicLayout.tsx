import * as React from 'react';
import { ReactNode } from 'react';

import { ProtonLogo } from '@proton/components/components';
import clsx from '@proton/utils/clsx';

interface PublicLayoutProps {
    img?: ReactNode;
    header?: ReactNode;
    main: ReactNode;
    footer?: ReactNode;
    below?: ReactNode;
    className?: string;
}

const PublicLayout = ({ img, header, main, footer, below, className }: PublicLayoutProps) => {
    const width = '30rem';
    return (
        <div className={clsx('flex flex-column flex-nowrap items-center', className)}>
            <ProtonLogo className="mb-4 mt-7 flex-item-noshrink" />
            <div
                className="w-custom max-w-4/5 flex flex-column flex-item-noshrink items-center mt-14 mb-8 border rounded-xl p-11"
                style={{ '--w-custom': width }}
            >
                {img && <div className="mb-6 flex-item-noshrink">{img}</div>}
                {header && <h1 className="h3 mb-6 text-bold flex-item-noshrink">{header}</h1>}

                {main}

                {footer && <div className="mt-8 w-full flex-item-noshrink">{footer}</div>}
            </div>
            <div className="flex-item-fluid" />
            <div className="w-custom max-w-4/5 flex-item-noshrink" style={{ '--w-custom': width }}>
                {below}
            </div>
        </div>
    );
};

export default PublicLayout;
