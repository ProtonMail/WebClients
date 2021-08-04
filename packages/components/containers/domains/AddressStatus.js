import PropTypes from 'prop-types';
import { c } from 'ttag';
import { RECEIVE_ADDRESS, ADDRESS_STATUS } from '@proton/shared/lib/constants';
import { Badge } from '../../components';

const AddressStatus = ({ address }) => {
    const { Status, Receive, HasKeys } = address;

    if (HasKeys === 0) {
        return <Badge type="warning">{c('Badge for domain').t`Missing keys`}</Badge>;
    }

    if (Status === ADDRESS_STATUS.STATUS_ENABLED && Receive === RECEIVE_ADDRESS.RECEIVE_YES) {
        return <Badge type="success">{c('Badge for domain').t`Enabled`}</Badge>;
    }

    if (Status === ADDRESS_STATUS.STATUS_DISABLED) {
        return <Badge type="error">{c('Badge for domain').t`Disabled`}</Badge>;
    }

    return null;
};

AddressStatus.propTypes = {
    address: PropTypes.object.isRequired,
};

export default AddressStatus;
