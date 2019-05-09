import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Modal, ContentModal, FooterModal, ResetButton, InnerModal } from 'react-components';

import AddressesTable from './AddressesTable';

const CatchAllModal = ({ domain, onClose }) => {
    return (
        <Modal type="small" onClose={onClose} title={c('Title').t`Catch all address`}>
            <ContentModal onReset={onClose}>
                <InnerModal>
                    <AddressesTable domain={domain} />
                </InnerModal>
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
