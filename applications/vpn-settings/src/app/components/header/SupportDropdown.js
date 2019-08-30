import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { SimpleDropdown, DropdownMenu, BugModal, Href, LinkButton, useModals } from 'react-components';

const SupportDropdown = ({ className, children }) => {
    const { createModal } = useModals();
    return (
        <SimpleDropdown className={className} content={c('Link').t`Support`}>
            <DropdownMenu>
                {children}
                <div className="inbl w100 pt0-5 pb0-5 ellipsis">
                    <Href url="https://protonvpn.com/support/">{c('Link').t`I have a question`}</Href>
                </div>
                <div className="inbl w100 pt0-5 pb0-5 ellipsis">
                    <LinkButton onClick={() => createModal(<BugModal />)}>{c('Action').t`Report a bug`}</LinkButton>
                </div>
            </DropdownMenu>
        </SimpleDropdown>
    );
};

SupportDropdown.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string
};

export default SupportDropdown;
