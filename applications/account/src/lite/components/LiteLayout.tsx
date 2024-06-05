import { ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

import { SupportedActions } from '../helper';

import './LiteLayout.scss';

interface Props {
    children: ReactNode;
    searchParams: URLSearchParams;
    className?: string;
}

const LiteLayout = ({ searchParams, className, children }: Props) => {
    const classNames = () => {
        const action = searchParams.get('action') || undefined;
        if (action === SupportedActions.SubscribeAccount || action === SupportedActions.SubscribeAccountLink) {
            return 'lite-layout--dark-bg';
        }
    };
    return <div className={clsx(classNames(), 'h-full', className)}>{children}</div>;
};

export default LiteLayout;
