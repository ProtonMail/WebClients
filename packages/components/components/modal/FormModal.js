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
    noValidate,
    ...rest
}) => {
    // Because we will forget
    if (!['isClosing', 'isBehind', 'onExit'].every((key) => rest.hasOwnProperty(key))) {
        console.warn(`You must pass props to <FormModal ...rest>,
These props contains mandatory keys from the hook.
Ex: onClose

function DemoModal({ onAdd, ...rest }) {

    const handleSubmit = () => {
        // XXX
        onAdd('XXX');
        rest.onClose();
    };

    return (<FormModal onSubmit={handleSubmit} ...rest />);
}
`);
    }

    return (
        <DialogModal modalTitleID={modalTitleID} {...rest}>
            {title ? (
                <HeaderModal hasClose={hasClose} modalTitleID={modalTitleID} onClose={onClose}>
                    {title}
                </HeaderModal>
            ) : null}
            <ContentModal onSubmit={onSubmit} onReset={onClose} noValidate={noValidate}>
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
    noValidate: PropTypes.bool,
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
    noValidate: false,
    hasClose: true,
    modalTitleID: 'modalTitle'
};

export default Modal;
