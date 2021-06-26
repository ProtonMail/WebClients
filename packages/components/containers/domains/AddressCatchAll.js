import React, { useState, useEffect } from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { updateCatchAll } from '@proton/shared/lib/api/domains';
import { ADDRESS_TYPE } from '@proton/shared/lib/constants';
import { Checkbox } from '../../components';
import { useApiWithoutResult, useNotifications, useOrganization } from '../../hooks';

const AddressCatchAll = ({ address, domain, onChange }) => {
    const [organization] = useOrganization();
    const { request, loading } = useApiWithoutResult(updateCatchAll);
    const { createNotification } = useNotifications();
    const [state, changeState] = useState(!!address.CatchAll);
    const hasCatchAllSupport = address.Type === ADDRESS_TYPE.TYPE_CUSTOM_DOMAIN && organization.Features & 1;

    const handleChange = async ({ target }) => {
        const newValue = target.checked;
        await request(domain.ID, newValue ? address.ID : null);
        changeState(newValue);
        onChange(newValue);
        createNotification({ text: c('Success').t`Catch-all address updated` });
    };

    const handleClick = (event) => {
        if (!hasCatchAllSupport) {
            event.preventDefault();
            event.stopPropagation();
            createNotification({
                type: 'info',
                text: c('Warning').t`This feature is only available for ProtonMail Professional plans or higher`,
            });
        }
    };

    useEffect(() => {
        changeState(!!address.CatchAll);
    }, [address]);

    return (
        <Checkbox id={address.ID} disabled={loading} checked={state} onClick={handleClick} onChange={handleChange} />
    );
};

AddressCatchAll.propTypes = {
    address: PropTypes.object.isRequired,
    domain: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
};

export default AddressCatchAll;
