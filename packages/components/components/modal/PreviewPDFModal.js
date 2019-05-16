import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { Modal, ContentModal, FooterModal, ResetButton, InnerModal } from 'react-components';

const PreviewPDFModal = ({ onClose, url, title, filename }) => {
    return (
        <Modal onClose={onClose} title={title}>
            <ContentModal onReset={onClose}>
                <InnerModal>
                    <object data={url} className="w100" type="application/pdf" height={500} title={filename}>
                        <embed src={url} type="application/pdf" />
                    </object>
                </InnerModal>
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
    url: PropTypes.string,
    title: PropTypes.string,
    filename: PropTypes.string
};

PreviewPDFModal.defaultProps = {
    title: c('Title').t`Preview`
};

export default PreviewPDFModal;
