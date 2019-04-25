import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { Modal, ContentModal, FooterModal, ResetButton } from 'react-components';

const PreviewPDFModal = ({ show, onClose, url, title, filename }) => {
    return (
        <Modal show={show} onClose={onClose} title={title}>
            <ContentModal onReset={onClose}>
                <object data={url} className="w100" type="application/pdf" height={500} title={filename}>
                    <embed src={url} type="application/pdf" />
                </object>
                <FooterModal>
                    <ResetButton>{c('Action').t`Close`}</ResetButton>
                </FooterModal>
            </ContentModal>
        </Modal>
    );
};

PreviewPDFModal.propTypes = {
    show: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    url: PropTypes.string.isRequired,
    title: PropTypes.string,
    filename: PropTypes.string
};

PreviewPDFModal.defaultProps = {
    title: c('Title').t`Preview`
};

export default PreviewPDFModal;
