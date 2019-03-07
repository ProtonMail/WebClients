import React, { useState } from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Checkbox, useApiWithoutResult } from 'react-components';
import { updateCatchAll } from 'proton-shared/lib/api/domains';
import { createNotification } from 'proton-shared/lib/state/notifications/actions';
import { ADDRESS_TYPE } from 'proton-shared/lib/constants';

const AddressCatchAll = ({ organization, address, domain, createNotification }) => {
    const { request, loading } = useApiWithoutResult(updateCatchAll);
    const [state, changeState] = useState(!!address.CatchAll);
    const hasCatchAllSupport = address.Type === ADDRESS_TYPE.TYPE_CUSTOM_DOMAIN && organization.Features & 1;

    const handleChange = async () => {
        await request(domain.ID, address.ID);
        changeState(!state);
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
    organization: PropTypes.object.isRequired,
    createNotification: PropTypes.func.isRequired
};

const mapStateToProps = ({ organization }) => ({ organization });
const mapDispatchToProps = { createNotification };

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(AddressCatchAll);
