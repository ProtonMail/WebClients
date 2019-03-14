import React, { useState } from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Checkbox, useApiWithoutResult, useNotifications, useEventManager } from 'react-components';
import { updateCatchAll } from 'proton-shared/lib/api/domains';
import { ADDRESS_TYPE } from 'proton-shared/lib/constants';

const AddressCatchAll = ({ organization, address, domain }) => {
    const { call } = useEventManager();
    const { request, loading } = useApiWithoutResult(updateCatchAll);
    const { createNotification } = useNotifications();
    const [state, changeState] = useState(!!address.CatchAll);
    const hasCatchAllSupport = address.Type === ADDRESS_TYPE.TYPE_CUSTOM_DOMAIN && organization.Features & 1;

    const handleChange = async ({ target }) => {
        const newValue = target.checked;
        await request(domain.ID, newValue ? address.ID : null);
        await call();
        changeState(newValue);
        createNotification({ text: c('Success').t`Catch-all address updated` });
    };

    const handleClick = (event) => {
        if (!hasCatchAllSupport) {
            event.preventDefault();
            event.stopPropagation();
            createNotification({
                type: 'info',
                text: c('Warning').t`This feature is only available for ProtonMail Professional plans or higher`
            });
        }
    };

    return <Checkbox disabled={loading} checked={state} onClick={handleClick} onChange={handleChange} />;
};

AddressCatchAll.propTypes = {
    address: PropTypes.object.isRequired,
    domain: PropTypes.object.isRequired,
    organization: PropTypes.object.isRequired
};

const mapStateToProps = ({ organization }) => ({ organization });

export default connect(mapStateToProps)(AddressCatchAll);
