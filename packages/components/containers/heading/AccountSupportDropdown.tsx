import React, { useState } from 'react';
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
    DropdownMenuLink
} from '../../';
import { Link, withRouter, RouteComponentProps } from 'react-router-dom';
import { c } from 'ttag';
import { CLIENT_TYPES } from 'proton-shared/lib/constants';

import AccountSupportDropdownButton from './AccountSupportDropdownButton';

const { VPN } = CLIENT_TYPES;

interface Props extends RouteComponentProps {
    className?: string;
    noCaret?: boolean;
    children?: React.ReactNode;
}

const AccountSupportDropdown = ({ className, children, location, noCaret = false }: Props) => {
    const { UID } = useAuthentication();
    const { CLIENT_TYPE } = useConfig();
    const { createModal } = useModals();
    const [uid] = useState(generateUID('dropdown'));
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const isAuthenticated = !!UID;
    const isLogin = location.pathname === '/login';

    const handleBugReportClick = () => {
        createModal(isAuthenticated ? <AuthenticatedBugModal /> : <BugModal />);
    };

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
                                    CLIENT_TYPE === VPN
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
                                    CLIENT_TYPE === VPN
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
                                    CLIENT_TYPE === VPN
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

export default withRouter(AccountSupportDropdown);
