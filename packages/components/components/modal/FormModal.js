import React from 'react';
import PropTypes from 'prop-types';
import {
    FooterModal,
    DialogModal,
    HeaderModal,
    ContentModal,
    InnerModal,
    ResetButton,
    PrimaryButton
} from 'react-components';
import { c } from 'ttag';

const Modal = ({
    onClose,
    onSubmit,
    title,
    close = c('Action').t`Cancel`,
    submit = c('Action').t`Submit`,
    loading,
    children,
    modalTitleID,
    hasClose,
    ...rest
}) => {
    return (
        <DialogModal modalTitleID={modalTitleID} {...rest}>
            {title ? (
                <HeaderModal hasClose={hasClose} modalTitleID={modalTitleID} onClose={onClose}>
                    {title}
                </HeaderModal>
            ) : null}
            <ContentModal onSubmit={onSubmit} onReset={onClose}>
                <InnerModal>{children}</InnerModal>
                <FooterModal>
                    {typeof close === 'string' ? <ResetButton disabled={loading}>{close}</ResetButton> : close}
                    {typeof submit === 'string' ? (
                        <PrimaryButton loading={loading} type="submit">
                            {submit}
                        </PrimaryButton>
                    ) : (
                        submit
                    )}
                </FooterModal>
            </ContentModal>
        </DialogModal>
    );
};

Modal.propTypes = {
    ...DialogModal.propTypes,
    modalTitleID: PropTypes.string,
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func,
    title: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
    loading: PropTypes.bool,
    submit: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    close: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    small: PropTypes.bool,
    background: PropTypes.bool,
    hasClose: PropTypes.bool
};

Modal.defaultProps = {
    className: '',
    small: false,
    loading: false,
    isBehind: false,
    isClosing: false,
    hasClose: true,
    modalTitleID: 'modalTitle'
};

export default Modal;
