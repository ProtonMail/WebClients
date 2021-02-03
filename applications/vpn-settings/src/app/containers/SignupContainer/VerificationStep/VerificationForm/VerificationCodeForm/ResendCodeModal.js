import React from 'react';
import PropTypes from 'prop-types';
import { DialogModal, HeaderModal, InnerModal, FooterModal, PrimaryButton, Button } from 'react-components';
import { c } from 'ttag';

const ResendCodeModal = ({ modalTitleID = 'modalTitle', onResend, onBack, destination, onClose, ...rest }) => {
    const editI18n = c('Action').t`Edit`;
    const destinationText = <strong key="destination">{destination.Address || destination.Phone}</strong>;
    const destinationType = destination.Address ? c('VerificationType').t`email` : c('VerificationType').t`phone`;

    return (
        <DialogModal modalTitleID={modalTitleID} onClose={onClose} {...rest}>
            <HeaderModal hasClose modalTitleID={modalTitleID} onClose={onClose}>
                {c('Title').t`Resend code`}
            </HeaderModal>
            <div className="modal-content">
                <InnerModal>
                    <p>
                        {c('Info')
                            .jt`Click below to resend the code to ${destinationText}. If ${destinationType} is incorrect, please click "${editI18n}".`}
                    </p>
                </InnerModal>
                <FooterModal>
                    <div className="flex w100 flex-justify-space-between">
                        <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>
                        <div>
                            <Button
                                className="mr1"
                                onClick={() => {
                                    onBack();
                                    onClose();
                                }}
                            >
                                {editI18n}
                            </Button>
                            <PrimaryButton
                                onClick={() => {
                                    onResend();
                                    onClose();
                                }}
                            >{c('Action').t`Resend`}</PrimaryButton>
                        </div>
                    </div>
                </FooterModal>
            </div>
        </DialogModal>
    );
};

ResendCodeModal.propTypes = {
    modalTitleID: PropTypes.string,
    destination: PropTypes.shape({
        Phone: PropTypes.string,
        Address: PropTypes.string,
    }).isRequired,
    onResend: PropTypes.func.isRequired,
    onClose: PropTypes.func,
    onBack: PropTypes.func,
};

export default ResendCodeModal;
