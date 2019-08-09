import React, { useState } from 'react';
import { c } from 'ttag';
import {
    useUser,
    useOrganization,
    useAuthentication,
    useModals,
    usePopperAnchor,
    Icon,
    Dropdown,
    BugModal,
    DonateModal,
    generateUID,
    PrimaryButton
} from 'react-components';
import UserDropdownButton from './UserDropdownButton';

const UserDropdown = (props) => {
    const [{ DisplayName, Email }] = useUser();
    const [{ Name: organizationName } = {}] = useOrganization();
    const { logout } = useAuthentication();
    const { createModal } = useModals();
    const [uid] = useState(generateUID('dropdown'));
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor();

    const handleBugReportClick = () => {
        createModal(<BugModal />);
    };

    const handleSupportUsClick = () => {
        createModal(<DonateModal />);
    };

    return (
        <div className="userDropdown">
            <UserDropdownButton
                {...props}
                aria-describedby={uid}
                buttonRef={anchorRef}
                isOpen={isOpen}
                onClick={toggle}
            />
            <Dropdown id={uid} isOpen={isOpen} anchorRef={anchorRef} onClose={close} originalPlacement="bottom-right">
                <ul className="unstyled mt0-5 mb0-5">
                    <li className="dropDown-item pt0-5 pb0-5 pl1 pr1 flex flex-column">
                        <strong title={DisplayName} className="ellipsis mw100 capitalize">
                            {DisplayName}
                        </strong>
                        <span title={Email} className="ellipsis mw100">
                            {Email}
                        </span>
                        {organizationName ? (
                            <span title={organizationName} className="ellipsis mw100">
                                {organizationName}
                            </span>
                        ) : null}
                    </li>
                    <li className="dropDown-item pl1 pr1">
                        <a
                            className="w100 flex flex-nowrap color-global-grey nodecoration pt0-5 pb0-5"
                            href="/settings"
                        >
                            <Icon className="mt0-25 mr0-5 fill-currentColor" name="settings" />
                            {c('Action').t`Settings`}
                        </a>
                    </li>
                    <li className="dropDown-item pl1 pr1">
                        <a
                            className="w100 flex flex-nowrap color-global-grey nodecoration pt0-5 pb0-5"
                            href="https://protonmail.com/support/"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Icon className="mt0-25 mr0-5 fill-currentColor" name="help-answer" />
                            {c('Action').t`Contact support`}
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
                            target="_blank"
                            rel="noopener noreferrer"
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
                        <PrimaryButton className="w100 aligncenter navigationUser-logout" onClick={logout}>
                            {c('Action').t`Logout`}
                        </PrimaryButton>
                    </li>
                </ul>
            </Dropdown>
        </div>
    );
};

export default UserDropdown;
