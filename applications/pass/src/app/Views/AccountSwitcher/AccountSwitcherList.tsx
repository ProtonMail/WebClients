import type { FC } from 'react';

import { useAuthSwitch } from 'proton-pass-web/app/Auth/AuthSwitchProvider';
import { c } from 'ttag';

import { UserPanel } from '@proton/pass/components/Account/UserPanel';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import type { SwitchableSession } from '@proton/pass/lib/auth/switch';
import { AuthMode } from '@proton/pass/types';

export type AccountSwitcherProps = {
    sessions: SwitchableSession[];
    childClassName?: string;
};

export const AccountSwitcherList: FC<AccountSwitcherProps> = ({ sessions, childClassName }) => {
    const authSwitch = useAuthSwitch();

    return sessions.map(({ LocalID, PrimaryEmail, DisplayName, UID }) => (
        <DropdownMenuButton
            key={LocalID}
            onClick={() => authSwitch.switch(LocalID)}
            label={<UserPanel email={PrimaryEmail} name={DisplayName} />}
            quickActionsClassname="pr-2"
            quickActionsPlacement="bottom-end"
            className={childClassName}
            parentClassName="max-w-full"
            quickActions={[
                <DropdownMenuButton
                    key="revoke"
                    size="small"
                    label={c('Action').t`Sign out`}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        return authSwitch.revoke({ type: AuthMode.COOKIE, UID });
                    }}
                />,
            ]}
        />
    ));
};
