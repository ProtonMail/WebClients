import type { ReactNode } from 'react';

import { getDarkThemes } from '@proton/shared/lib/themes/themes';
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
        const darkThemes = getDarkThemes();
        const themeParam = searchParams.get('theme');
        const theme = themeParam && parseInt(themeParam, 10);

        const action = searchParams.get('action') || undefined;
        if (
            action === SupportedActions.SubscribeAccount ||
            action === SupportedActions.SubscribeAccountLink ||
            action === SupportedActions.VPNLite
        ) {
            return 'lite-layout--dark-bg';
        }
        // needed class to be able to override some Carbon values for ET
        if (theme && darkThemes.includes(theme)) {
            return 'lite-layout--et-dark';
        }
    };
    return <div className={clsx(classNames(), 'h-full', className)}>{children}</div>;
};

export default LiteLayout;
