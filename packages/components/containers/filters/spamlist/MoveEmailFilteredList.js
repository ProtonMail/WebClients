import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { SmallButton, Icon, useApiWithoutResult, useNotifications } from 'react-components';
import { updateIncomingDefault } from 'proton-shared/lib/api/incomingDefaults';
import { noop } from 'proton-shared/lib/helpers/function';
import { MAILBOX_IDENTIFIERS } from 'proton-shared/lib/constants';

const BLACKLIST_TYPE = +MAILBOX_IDENTIFIERS.spam;
const WHITELIST_TYPE = +MAILBOX_IDENTIFIERS.inbox;

function MoveEmailFilteredList({ type, dest, email, className, onClick }) {
    const { createNotification } = useNotifications();
    const { request } = useApiWithoutResult(updateIncomingDefault);
    const iconName = type === 'whitelist' ? `arrow-right` : `arrow-left`;

    const I18N = {
        blacklist: c('Title').t`blacklist`,
        whitelist: c('Title').t`whitelist`
    };

    const handleClick = async () => {
        const { Email, ID } = email;
        const Location = dest === 'whitelist' ? WHITELIST_TYPE : BLACKLIST_TYPE;
        const { IncomingDefault: data } = await request(ID, { Location });
        createNotification({
            text: c('Moved to black/whitelist').t`${Email} moved to ${I18N[dest]}`
        });
        onClick(dest, data);
    };

    return (
        <>
            <SmallButton className={className} onClick={handleClick}>
                <Icon name={iconName} />
            </SmallButton>
        </>
    );
}

MoveEmailFilteredList.propTypes = {
    className: PropTypes.string,
    email: PropTypes.object.isRequired,
    dest: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    onClick: PropTypes.func
};

MoveEmailFilteredList.defaultProps = {
    onClick: noop
};

export default MoveEmailFilteredList;
