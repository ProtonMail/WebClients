import React, { useState } from 'react';
import { c } from 'ttag';
import { APPS, isSSOMode, SSO_PATHS } from 'proton-shared/lib/constants';
import { getAppHref } from 'proton-shared/lib/apps/helper';
import { requestFork } from 'proton-shared/lib/authentication/sessionForking';
import { FORK_TYPE } from 'proton-shared/lib/authentication/ForkInterface';

import { useAuthentication, useConfig, useUser, useOrganization } from '../../hooks';
import { usePopperAnchor, Dropdown, Icon, DropdownMenu, DropdownMenuButton } from '../../components';
import { generateUID } from '../../helpers';
import UserDropdownButton, { Props } from './UserDropdownButton';

const UserDropdown = (rest: Omit<Props, 'user' | 'isOpen' | 'onClick'>) => {
    const { APP_NAME } = useConfig();
    const [organization] = useOrganization();
    const { Name: organizationName } = organization || {};
    const [user] = useUser();
    const { logout } = useAuthentication();
    const [uid] = useState(generateUID('dropdown'));
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const handleSwitchAccount = () => {
        if (APP_NAME === APPS.PROTONACCOUNT) {
            const href = getAppHref(SSO_PATHS.SWITCH, APPS.PROTONACCOUNT);
            return document.location.assign(href);
        }
        return requestFork(APP_NAME, undefined, FORK_TYPE.SWITCH);
    };

    const handleLogout = () => {
        logout();
        close();
    };

    return (
        <>
            <UserDropdownButton
                data-cy-header="userDropdown"
                {...rest}
                user={user}
                ref={anchorRef}
                isOpen={isOpen}
                onClick={toggle}
            />
            <Dropdown
                id={uid}
                className="userDropdown"
                style={{ '--min-width': '18em' }}
                isOpen={isOpen}
                noMaxSize
                anchorRef={anchorRef}
                autoClose={false}
                onClose={close}
                originalPlacement="bottom-right"
            >
                <DropdownMenu>
                    {APP_NAME !== APPS.PROTONVPN_SETTINGS && organizationName ? (
                        <>
                            <li className="pt0-5 pr1 pb0-5 pl1">
                                <div className="text-bold">{c('Label').t`Organization`}</div>
                                <div>{organizationName}</div>
                            </li>
                            <hr className="mt0-5 mb0-5" />
                        </>
                    ) : null}
                    {isSSOMode ? (
                        <>
                            <DropdownMenuButton
                                className="flex flex-nowrap flex-justify-space-between flex-align-items-center"
                                onClick={handleSwitchAccount}
                            >
                                {c('Action').t`Switch account`}
                                <Icon className="ml1" name="account-switch" />
                            </DropdownMenuButton>
                            <hr className="mt0-5 mb0-5" />
                        </>
                    ) : null}

                    <DropdownMenuButton
                        className="flex flex-nowrap flex-justify-space-between flex-align-items-center"
                        onClick={handleLogout}
                        data-cy-header-user-dropdown="logout"
                    >
                        <span className="mr1">{c('Action').t`Sign out`}</span>
                        <Icon name="sign-out-right" />
                    </DropdownMenuButton>
                </DropdownMenu>
            </Dropdown>
        </>
    );
};

export default UserDropdown;
