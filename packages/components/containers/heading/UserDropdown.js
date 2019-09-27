import React, { useState } from 'react';
import { c } from 'ttag';
import { Link } from 'react-router-dom';
import {
    useUser,
    useOrganization,
    useAuthentication,
    useModals,
    usePopperAnchor,
    useApi,
    Icon,
    Dropdown,
    AuthenticatedBugModal,
    DonateModal,
    generateUID,
    PrimaryButton,
    useConfig
} from 'react-components';
import { revoke } from 'proton-shared/lib/api/auth';
import { APPS, CLIENT_TYPES } from 'proton-shared/lib/constants';

import UserDropdownButton from './UserDropdownButton';

const { PROTONMAIL_SETTINGS } = APPS;
const { VPN } = CLIENT_TYPES;

const UserDropdown = ({ ...rest }) => {
    const { APP_NAME, CLIENT_TYPE } = useConfig();
    const api = useApi();
    const [user] = useUser();
    const { DisplayName, Email, Name } = user;
    const [{ Name: organizationName } = {}] = useOrganization();
    const { logout } = useAuthentication();
    const { createModal } = useModals();
    const [uid] = useState(generateUID('dropdown'));
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor();

    const handleBugReportClick = () => {
        createModal(<AuthenticatedBugModal />);
    };

    const handleSupportUsClick = () => {
        createModal(<DonateModal />);
    };

    const handleLogout = () => {
        api(revoke()); // Kick off the revoke request, but don't care for the result.
        logout();
    };

    return (
        <div className="userDropdown" data-cy-header="userDropdown">
            <UserDropdownButton {...rest} user={user} buttonRef={anchorRef} isOpen={isOpen} onClick={toggle} />
            <Dropdown id={uid} isOpen={isOpen} anchorRef={anchorRef} onClose={close} originalPlacement="bottom-right">
                <ul className="unstyled mt0-5 mb0-5">
                    <li className="dropDown-item pt0-5 pb0-5 pl1 pr1 flex flex-column">
                        <strong title={DisplayName || Name} className="ellipsis mw100 capitalize">
                            {DisplayName || Name}
                        </strong>
                        {Email ? (
                            <span title={Email} className="ellipsis mw100">
                                {Email}
                            </span>
                        ) : null}
                        {organizationName ? (
                            <span title={organizationName} className="ellipsis mw100">
                                {organizationName}
                            </span>
                        ) : null}
                    </li>
                    {CLIENT_TYPE === VPN ? null : (
                        <li className="dropDown-item pl1 pr1">
                            {APP_NAME === PROTONMAIL_SETTINGS ? (
                                <Link
                                    to="/settings"
                                    className="w100 flex flex-nowrap color-global-grey nodecoration pt0-5 pb0-5"
                                >
                                    <Icon className="mt0-25 mr0-5 fill-currentColor" name="settings" />
                                    {c('Action').t`Settings`}
                                </Link>
                            ) : (
                                <a
                                    className="w100 flex flex-nowrap color-global-grey nodecoration pt0-5 pb0-5"
                                    href="/settings"
                                >
                                    <Icon className="mt0-25 mr0-5 fill-currentColor" name="settings" />
                                    {c('Action').t`Settings`}
                                </a>
                            )}
                        </li>
                    )}
                    <li className="dropDown-item pl1 pr1">
                        <a
                            className="w100 flex flex-nowrap color-global-grey nodecoration pt0-5 pb0-5"
                            href={
                                CLIENT_TYPE === VPN
                                    ? 'https://protonvpn.com/support/'
                                    : 'https://protonmail.com/support/'
                            }
                            // eslint-disable-next-line react/jsx-no-target-blank
                            target="_blank"
                        >
                            <Icon className="mt0-25 mr0-5 fill-currentColor" name="what-is-this" />
                            {c('Action').t`I have a question`}
                        </a>
                    </li>
                    <li className="dropDown-item pl1 pr1">
                        <button
                            type="button"
                            className="w100 flex underline-hover pt0-5 pb0-5 alignleft"
                            onClick={handleBugReportClick}
                        >
                            <Icon className="mt0-25 mr0-5 fill-currentColor" name="report-bug" />
                            {c('Action').t`Report bug`}
                        </button>
                    </li>
                    <li className="dropDown-item pl1 pr1">
                        <a
                            className="w100 flex flex-nowrap color-global-grey nodecoration pt0-5 pb0-5"
                            href="https://shop.protonmail.com"
                            // eslint-disable-next-line react/jsx-no-target-blank
                            target="_blank"
                        >
                            <Icon className="mt0-25 mr0-5 fill-currentColor" name="shop" />
                            {c('Action').t`Proton shop`}
                        </a>
                    </li>
                    <li className="dropDown-item pl1 pr1">
                        <button
                            type="button"
                            className="w100 flex underline-hover pt0-5 pb0-5 alignleft"
                            onClick={handleSupportUsClick}
                        >
                            <Icon className="mt0-25 mr0-5 fill-currentColor" name="donate" />
                            {c('Action').t`Support us`}
                        </button>
                    </li>
                    <li className="dropDown-item pt0-5 pb0-5 pl1 pr1 flex">
                        <PrimaryButton
                            className="w100 aligncenter navigationUser-logout"
                            onClick={handleLogout}
                            data-cy-header-user-dropdown="logout"
                        >
                            {c('Action').t`Logout`}
                        </PrimaryButton>
                    </li>
                </ul>
            </Dropdown>
        </div>
    );
};

export default UserDropdown;
