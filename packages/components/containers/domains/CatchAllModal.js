import PropTypes from 'prop-types';
import { c } from 'ttag';
import { FormModal } from '../../components';

import AddressesTable from './AddressesTable';

const CatchAllModal = ({ domain, domainAddresses, onClose, ...rest }) => {
    return (
        <FormModal
            onClose={onClose}
            close={c('Action').t`Close`}
            title={c('Title').t`Catch-All address`}
            hasSubmit={false}
            {...rest}
        >
            <AddressesTable domain={domain} domainAddresses={domainAddresses} />
        </FormModal>
    );
};

CatchAllModal.propTypes = {
    onClose: PropTypes.func,
    domain: PropTypes.object.isRequired,
    domainAddresses: PropTypes.array.isRequired,
};

export default CatchAllModal;
