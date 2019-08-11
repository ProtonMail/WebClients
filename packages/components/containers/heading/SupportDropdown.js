import React from 'react';
import PropTypes from 'prop-types';
import { SimpleDropdown, Icon, useModals, BugModal } from 'react-components';
import { c } from 'ttag';

const SupportDropdown = ({ className }) => {
    const { createModal } = useModals();

    const handleBugReportClick = () => {
        createModal(<BugModal />);
    };

    return (
        <SimpleDropdown icon="support1" className={className} content={c('Button in header').t`Support`}>
            <ul className="unstyled mt0-5 mb0-5">
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
            </ul>
        </SimpleDropdown>
    );
};

SupportDropdown.propTypes = {
    className: PropTypes.string
};

export default SupportDropdown;
