import type { FC, ReactNode } from 'react';
import { useEffect } from 'react';

import { useAuthService } from 'proton-pass-web/app/Auth/AuthServiceProvider';
import {
    AccountSwitcherList,
    type AccountSwitcherProps,
} from 'proton-pass-web/app/Views/AccountSwitcher/AccountSwitcherList';
import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import Icon from '@proton/components/components/icon/Icon';
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor';
import { useOnline } from '@proton/pass/components/Core/ConnectivityProvider';
import { usePassConfig } from '@proton/pass/hooks/usePassConfig';
import { useRerender } from '@proton/pass/hooks/useRerender';
import { ForkType } from '@proton/shared/lib/authentication/fork';
import { APPS } from '@proton/shared/lib/constants';

type PopperProps = ReturnType<typeof usePopperAnchor<HTMLButtonElement>>;
type AccountSwitcherTooltipProps = AccountSwitcherProps & {
    children: (props: PopperProps) => ReactNode;
};

export const AccountSwitcherTooltip: FC<AccountSwitcherTooltipProps> = ({ children, sessions }) => {
    const { SSO_URL } = usePassConfig();
    const online = useOnline();

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
                        disabled={!online}
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
