import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Modal, ContentModal, FooterModal, ResetButton } from 'react-components';

import AddressesTable from './AddressesTable';

const CatchAllModal = ({ domain, onClose }) => {
    return (
        <Modal type="small" onClose={onClose} title={c('Title').t`Catch all address`}>
            <ContentModal onReset={onClose}>
                <AddressesTable domain={domain} />
                <FooterModal>
                    <ResetButton>{c('Action').t`Close`}</ResetButton>
                </FooterModal>
            </ContentModal>
        </Modal>
    );
};

CatchAllModal.propTypes = {
    onClose: PropTypes.func.isRequired,
    domain: PropTypes.object.isRequired
};

export default CatchAllModal;
