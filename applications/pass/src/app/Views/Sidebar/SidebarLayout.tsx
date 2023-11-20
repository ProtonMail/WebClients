import { type FC } from 'react';

import { Logo } from '@proton/components/components';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

type Props = {
    expanded?: boolean;
    onToggleExpand?: () => void;
};

export const SidebarLayout: FC<Props> = ({ children, expanded = false, onToggleExpand }) => (
    <>
        <div className="sidebar flex flex-nowrap flex-column outline-none" data-expanded={expanded}>
            <h1 className="sr-only">{getAppName(APPS.PROTONPASS)}</h1>
            <div className="logo-container hidden md:flex flex-item-noshrink flex-justify-space-between flex-align-items-center flex-nowrap">
                <Logo appName={APPS.PROTONPASS} />
            </div>

            <div className="mt-1 md:mt-0" aria-hidden="true" />
            <div className={clsx('flex-item-nogrow', 'flex-nowrap flex flex-column overflow-overlay pb-2 md:mt-2')}>
                {children}
            </div>
        </div>
        {expanded ? <div className="sidebar-backdrop" onClick={onToggleExpand} onKeyDown={noop}></div> : undefined}
    </>
);
