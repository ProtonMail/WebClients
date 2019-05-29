import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { SmallButton, Icon, useApiWithoutResult, useNotifications } from 'react-components';
import { deleteIncomingDefaults } from 'proton-shared/lib/api/incomingDefaults';
import { noop } from 'proton-shared/lib/helpers/function';

function RemoveEmailFilteredList({ type, email, className, onClick }) {
    const { createNotification } = useNotifications();
    const { request, loading } = useApiWithoutResult(deleteIncomingDefaults);

    const I18N = {
        blacklist: c('Title').t`blacklist`,
        whitelist: c('Title').t`whitelist`
    };

    const handleClick = async () => {
        const { Email, ID } = email;
        await request([ID]);
        createNotification({
            text: c('Moved to black/whitelist').t`${Email} removed from ${I18N[type]}`
        });
        onClick(type, email);
    };

    return (
        <>
            <SmallButton className={className} onClick={handleClick} loading={loading}>
                <Icon name="close" />
            </SmallButton>
        </>
    );
}

RemoveEmailFilteredList.propTypes = {
    className: PropTypes.string,
    email: PropTypes.object.isRequired,
    type: PropTypes.string.isRequired,
    onClick: PropTypes.func
};

RemoveEmailFilteredList.defaultProps = {
    onClick: noop
};

export default RemoveEmailFilteredList;
