import { ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

import getIsDarkLayout from '../helper';

import './LiteLayout.scss';

interface Props {
    children: ReactNode;
    searchParams?: URLSearchParams;
    className?: string;
}

const LiteLayout = ({ searchParams, className, children }: Props) => {
    const dark = searchParams ? getIsDarkLayout(searchParams) : false;
    return (
        <div className={clsx(dark ? 'lite-layout--dark-bg' : 'lite-layout--light-bg', 'h-full', className)}>
            {children}
        </div>
    );
};

export default LiteLayout;
