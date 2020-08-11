import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { c } from 'ttag';
import { APPS } from 'proton-shared/lib/constants';
import {
    Icon,
    Dropdown,
    useModals,
    AuthenticatedBugModal,
    useAuthentication,
    usePopperAnchor,
    generateUID,
    useConfig,
    BugModal,
    DropdownMenu,
    DropdownMenuButton,
    DropdownMenuLink,
} from '../..';

import AccountSupportDropdownButton from './AccountSupportDropdownButton';

interface Props {
    className?: string;
    noCaret?: boolean;
    children?: React.ReactNode;
}

const AccountSupportDropdown = ({ className, children, noCaret = false }: Props) => {
    const location = useLocation();
    const { UID } = useAuthentication();
    const { APP_NAME } = useConfig();
    const { createModal } = useModals();
    const [uid] = useState(generateUID('dropdown'));
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const isAuthenticated = !!UID;
    const isLogin = location.pathname === '/login';

    const handleBugReportClick = () => {
        createModal(isAuthenticated ? <AuthenticatedBugModal /> : <BugModal />);
    };

    const isVPN = APP_NAME === APPS.PROTONVPN_SETTINGS;

    return (
        <>
            <AccountSupportDropdownButton
                className={className}
                aria-describedby={uid}
                buttonRef={anchorRef}
                isOpen={isOpen}
                noCaret={noCaret}
                onClick={toggle}
            >
                {children}
            </AccountSupportDropdownButton>
            <Dropdown id={uid} isOpen={isOpen} anchorRef={anchorRef} onClose={close} originalPlacement="bottom">
                <DropdownMenu>
                    {isLogin ? (
                        <>
                            <Link
                                to="/reset-password"
                                className="dropDown-item-link w100 pr1 pl1 pt0-5 pb0-5 bl nodecoration flex flex-nowrap alignleft"
                            >
                                {c('Link').t`Reset password`}
                            </Link>
                            <Link
                                to="/forgot-username"
                                className="dropDown-item-link w100 pr1 pl1 pt0-5 pb0-5 bl nodecoration flex flex-nowrap alignleft"
                            >
                                {c('Link').t`Forgot username?`}
                            </Link>
                            <DropdownMenuLink
                                href={
                                    isVPN
                                        ? 'https://protonvpn.com/support/login-problems/'
                                        : 'https://protonmail.com/support/knowledge-base/common-login-problems/'
                                }
                                target="_blank"
                                className="flex flex-nowrap alignleft"
                            >
                                {c('Link').t`Common login problems`}
                            </DropdownMenuLink>
                            <DropdownMenuLink
                                href={
                                    isVPN
                                        ? 'https://protonvpn.com/support/'
                                        : 'https://protonmail.com/support/'
                                }
                                target="_blank"
                                className="flex flex-nowrap alignleft"
                            >
                                {c('Link').t`Contact support`}
                            </DropdownMenuLink>
                            <DropdownMenuButton className="flex flex-nowrap alignleft" onClick={handleBugReportClick}>
                                {c('Action').t`Report bug`}
                            </DropdownMenuButton>
                        </>
                    ) : (
                        <>
                            <DropdownMenuLink
                                className="flex flex-nowrap alignleft"
                                href={
                                    isVPN
                                        ? 'https://protonvpn.com/support/'
                                        : 'https://protonmail.com/support/'
                                }
                                target="_blank"
                            >
                                <Icon className="mt0-25 mr0-5" name="what-is-this" />
                                {c('Action').t`I have a question`}
                            </DropdownMenuLink>
                            <DropdownMenuButton className="flex flex-nowrap alignleft" onClick={handleBugReportClick}>
                                <Icon className="mt0-25 mr0-5" name="report-bug" />
                                {c('Action').t`Report bug`}
                            </DropdownMenuButton>
                        </>
                    )}
                </DropdownMenu>
            </Dropdown>
        </>
    );
};

export default AccountSupportDropdown;
