import { ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

import getIsDarkLayout from '../helper';

import './LiteLayout.scss';

interface Props {
    children: ReactNode;
    searchParams?: URLSearchParams;
}

const LiteLayout = ({ searchParams, children }: Props) => {
    const dark = searchParams ? getIsDarkLayout(searchParams) : false;
    return <div className={clsx(dark ? 'lite-layout--dark-bg' : 'lite-layout--light-bg', 'h-full')}>{children}</div>;
};

export default LiteLayout;
