import React, { useState } from 'react';
import { Icon, Dropdown, useModals, BugModal, usePopperAnchor, generateUID, useConfig } from 'react-components';
import { c } from 'ttag';
import { APPS } from 'proton-shared/lib/constants';

import SupportDropdownButton from './SupportDropdownButton';

const { PROTONVPN_SETTINGS } = APPS;

const SupportDropdown = () => {
    const { APP_NAME } = useConfig();
    const { createModal } = useModals();
    const [uid] = useState(generateUID('dropdown'));
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor();

    const handleBugReportClick = () => {
        createModal(<BugModal />);
    };

    return (
        <>
            <SupportDropdownButton aria-describedby={uid} buttonRef={anchorRef} isOpen={isOpen} onClick={toggle} />
            <Dropdown id={uid} isOpen={isOpen} anchorRef={anchorRef} onClose={close} originalPlacement="bottom">
                <ul className="unstyled mt0-5 mb0-5">
                    <li className="dropDown-item pl1 pr1">
                        <a
                            className="w100 flex flex-nowrap color-global-grey nodecoration pt0-5 pb0-5"
                            href={
                                APP_NAME === PROTONVPN_SETTINGS
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
                </ul>
            </Dropdown>
        </>
    );
};

export default SupportDropdown;
