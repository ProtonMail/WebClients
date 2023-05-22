import { ReactNode } from 'react';

import { c } from 'ttag';

import { BRAND_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import LayoutLogosV2 from '../public/LayoutLogosV2';

interface Props {
    children?: ReactNode;
    className?: string;
    center?: boolean;
}

const PublicFooter = ({ children, className, center = true }: Props) => {
    return (
        <footer className={clsx('text-sm', className)}>
            <div className="mb-1">
                <LayoutLogosV2 size={20} className={center ? 'flex-justify-center' : undefined} />
            </div>
            <div className={clsx('mb-6 color-weak', center && 'text-center')}>
                {
                    // translator: full sentence 'Proton. Privacy by default.'
                    c('Footer').t`${BRAND_NAME}. Privacy by default.`
                }
            </div>
            {children}
        </footer>
    );
};

export default PublicFooter;
