import React from 'react';
import PropTypes from 'prop-types';
import { DialogModal, HeaderModal, InnerModal, FooterModal, PrimaryButton, Button } from 'react-components';
import { c } from 'ttag';

const ResendCodeModal = ({ modalTitleID = 'modalTitle', onResend, onBack, destination, onClose, ...rest }) => {
    const editI18n = c('Action').t`Edit`;
    const destinationText = <strong>{destination}</strong>;

    return (
        <DialogModal {...rest}>
            <HeaderModal hasClose modalTitleID={modalTitleID} onClose={onClose}>
                {c('Title').t`Resend code`}
            </HeaderModal>
            <div className="pm-modalContent">
                <InnerModal>
                    <p>
                        {c('Info')
                            .jt`Click below to resend the code to ${destinationText}. If ${destinationText} is incorrect, please click "${editI18n}".`}
                    </p>
                </InnerModal>
                <FooterModal>
                    <div className="flex w100 flex-spacebetween">
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
    ...DialogModal.propTypes,
    destination: PropTypes.string.isRequired,
    onResend: PropTypes.func.isRequired,
    onClose: PropTypes.func
};

export default ResendCodeModal;
