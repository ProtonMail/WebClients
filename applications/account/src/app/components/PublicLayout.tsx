import type { ReactNode } from 'react';

import { ProtonLogo } from '@proton/components';
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
            <ProtonLogo className="mb-4 mt-7 shrink-0" />
            <div
                className="w-custom max-w-4/5 flex flex-column shrink-0 items-center mt-14 mb-8 border rounded-xl p-11"
                style={{ '--w-custom': width }}
            >
                {img && <div className="mb-6 shrink-0">{img}</div>}
                {header && <h1 className="h3 mb-6 text-bold shrink-0">{header}</h1>}

                {main}

                {footer && <div className="mt-8 w-full shrink-0">{footer}</div>}
            </div>
            <div className="flex-1" />
            <div className="w-custom max-w-4/5 shrink-0" style={{ '--w-custom': width }}>
                {below}
            </div>
        </div>
    );
};

export default PublicLayout;
