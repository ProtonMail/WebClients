import type { ReactNode } from 'react';

import { c } from 'ttag';

import { ProtonLogo } from '@proton/components/index';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import LayoutLogosV2 from '../../../app/public/LayoutLogosV2';
import { SignOutContent } from './SignOutContent';

interface Props {
    layout: (children: ReactNode, props?: any) => ReactNode;
    initialHashParams: URLSearchParams;
}

export const SignOut = ({ layout, initialHashParams }: Props) => {
    return layout(
        <div className="flex flex-column flex-1 items-center py-7 h-full">
            <ProtonLogo size={6} color="brand" />
            <div className="py-16 flex-1 max-w-custom" style={{ '--max-w-custom': '30rem' }}>
                <SignOutContent initialHashParams={initialHashParams} />
            </div>
            <footer className="shrink-0 text-center px-4 pt-0 pb-0 sm:px-5 sm:pt-8 sm:pb-0">
                <LayoutLogosV2 size={7} className="flex justify-center gap-4 flex-nowrap" />
                <div className="mt-1 text-sm color-weak">{c('Footer').t`${BRAND_NAME}. Privacy by default.`}</div>
            </footer>
        </div>,
        { className: 'overflow-auto' }
    );
};
