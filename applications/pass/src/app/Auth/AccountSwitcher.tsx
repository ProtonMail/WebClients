import type { FC, ReactNode } from 'react';
import { useEffect } from 'react';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import { Dropdown, usePopperAnchor } from '@proton/components';
import { Icon } from '@proton/components/index';
import { UserPanel } from '@proton/pass/components/Account/UserPanel';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { usePassConfig } from '@proton/pass/hooks/usePassConfig';
import { useRerender } from '@proton/pass/hooks/useRerender';
import type { SwitchableSession } from '@proton/pass/lib/auth/switch';
import { AuthMode } from '@proton/pass/types';
import { ForkType } from '@proton/shared/lib/authentication/fork';
import { APPS } from '@proton/shared/lib/constants';

import { useAuthService } from './AuthServiceProvider';
import { useAuthSwitch } from './AuthSwitchProvider';

type AccountSwitcherProps = { sessions: SwitchableSession[] };

export const AccountSwitcherList: FC<AccountSwitcherProps> = ({ sessions }) => {
    const authSwitch = useAuthSwitch();

    return sessions.map(({ LocalID, PrimaryEmail, DisplayName, UID }) => (
        <DropdownMenuButton
            key={LocalID}
            onClick={() => authSwitch.switch(LocalID)}
            label={<UserPanel email={PrimaryEmail} name={DisplayName} />}
            quickActionsClassname="pr-3"
            quickActionsPlacement="bottom-end"
            className="rounded"
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

type PopperProps = ReturnType<typeof usePopperAnchor<HTMLButtonElement>>;
type AccountSwitcherTooltipProps = AccountSwitcherProps & { children: (props: PopperProps) => ReactNode };

export const AccountSwitcherTooltip: FC<AccountSwitcherTooltipProps> = ({ children, sessions }) => {
    const { SSO_URL } = usePassConfig();

    const authService = useAuthService();
    const dropdown = usePopperAnchor<HTMLButtonElement>();
    const [key, rerender] = useRerender();
    const canSwitch = sessions.length > 0;

    useEffect(rerender, [sessions]);

    return (
        <>
            {children(dropdown)}
            <Dropdown
                anchorRef={dropdown.anchorRef}
                className="rounded-xl"
                isOpen={dropdown.isOpen}
                offset={4}
                onClose={dropdown.close}
                originalPlacement="bottom"
                size={canSwitch ? { width: '20em' } : {}}
                key={key}
            >
                {canSwitch && (
                    <>
                        <span className="block text-semibold text-rg px-4 py-2">{c('Title').t`Switch to`}</span>
                        <hr className="mt-0 mb-1" />
                        <AccountSwitcherList sessions={sessions} />
                        <hr className="mt-1 mb-0" />
                    </>
                )}
                <div>
                    <ButtonLike
                        className="w-full text-left text-sm rounded-none"
                        shape="ghost"
                        color="weak"
                        icon
                        onClick={() =>
                            authService.requestFork({
                                app: APPS.PROTONPASS,
                                host: SSO_URL,
                                forkType: ForkType.SWITCH,
                            })
                        }
                    >
                        <span className="flex gap-2 items-center px-2">
                            <Icon name="user-plus" />
                            {c('Action').t`Add account`}
                        </span>
                    </ButtonLike>
                </div>
            </Dropdown>
        </>
    );
};
