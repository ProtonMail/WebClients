import type { FC } from 'react';

import { useAvailableSessions } from 'proton-pass-web/app/Auth/AuthSwitchProvider';
import { AccountSwitcherTooltip } from 'proton-pass-web/app/Views/AccountSwitcher/AccountSwitcherTooltip';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { MenuUserPanel } from '@proton/pass/components/Menu/Sidebar/MenuUserPanel';

export const AccountSwitcher: FC = () => {
    const sessions = useAvailableSessions();

    return (
        <AccountSwitcherTooltip sessions={sessions}>
            {({ anchorRef, toggle }) => (
                <ButtonLike ref={anchorRef} onClick={toggle} shape="ghost" className="flex-1" size="small">
                    <MenuUserPanel />
                </ButtonLike>
            )}
        </AccountSwitcherTooltip>
    );
};
