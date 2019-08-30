import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { SimpleDropdown, DropdownMenu, BugModal, Href, LinkButton, Icon, useModals } from 'react-components';

const SupportDropdown = ({ className }) => {
    const { createModal } = useModals();
    return (
        <SimpleDropdown className={className} content={c('Link').t`Support`}>
            <DropdownMenu>
                <div className="inbl w100 pt0-5 pb0-5 ellipsis">
                    <Href url="https://protonvpn.com/support/">
                        <Icon className="mr0-5 fill-currentColor" name="what-is-this" />
                        {c('Action').t`I have a question`}
                    </Href>
                </div>
                <div className="inbl w100 pt0-5 pb0-5 ellipsis">
                    <LinkButton onClick={() => createModal(<BugModal />)}>
                        <Icon className="mr0-5 fill-currentColor" name="report-bug" />
                        {c('Action').t`Report bug`}
                    </LinkButton>
                </div>
            </DropdownMenu>
        </SimpleDropdown>
    );
};

SupportDropdown.propTypes = {
    className: PropTypes.string
};

export default SupportDropdown;
