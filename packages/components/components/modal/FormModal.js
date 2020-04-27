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
import { noop } from 'proton-shared/lib/helpers/function';

/** @type any */
const Modal = ({
    onClose,
    onSubmit,
    title,
    close = c('Action').t`Cancel`,
    submit = c('Action').t`Submit`,
    loading = false,
    children,
    modalTitleID = 'modalTitle',
    footer,
    hasSubmit = true,
    hasClose = true,
    noValidate = false,
    autoFocusClose = true,
    // Destructure these options so they are not passed to the DOM.
    // eslint-disable-next-line no-unused-vars,@typescript-eslint/no-unused-vars
    disableCloseOnLocation,
    // eslint-disable-next-line no-unused-vars,@typescript-eslint/no-unused-vars
    disableCloseOnOnEscape,
    ...rest
}) => {
    // Because we will forget
    if (!['isClosing', 'isBehind', 'onExit'].every((key) => rest[key])) {
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

    const getFooter = () => {
        if (footer === null) {
            return null;
        }

        if (footer) {
            return <FooterModal>{footer}</FooterModal>;
        }

        const nodeSubmit =
            typeof submit === 'string' ? (
                <PrimaryButton loading={loading} type="submit">
                    {submit}
                </PrimaryButton>
            ) : (
                submit
            );
        const submitBtn = hasSubmit ? nodeSubmit : null;

        return (
            <FooterModal>
                {typeof close === 'string' ? (
                    <ResetButton disabled={loading} autoFocus={autoFocusClose}>
                        {close}
                    </ResetButton>
                ) : (
                    close
                )}
                {submitBtn}
            </FooterModal>
        );
    };

    return (
        <DialogModal modalTitleID={modalTitleID} onClose={onClose} {...rest}>
            {title ? (
                <HeaderModal hasClose={hasClose} modalTitleID={modalTitleID} onClose={onClose}>
                    {title}
                </HeaderModal>
            ) : null}
            <ContentModal
                onSubmit={rest.isClosing || loading ? noop : onSubmit}
                onReset={onClose}
                noValidate={noValidate}
            >
                <InnerModal>{children}</InnerModal>
                {getFooter()}
            </ContentModal>
        </DialogModal>
    );
};

Modal.propTypes = {
    ...DialogModal.propTypes,
    modalTitleID: PropTypes.string,
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func,
    title: PropTypes.node,
    children: PropTypes.node.isRequired,
    loading: PropTypes.bool,
    submit: PropTypes.node,
    close: PropTypes.node,
    noValidate: PropTypes.bool,
    small: PropTypes.bool,
    background: PropTypes.bool,
    hasSubmit: PropTypes.bool,
    hasClose: PropTypes.bool,
    autoFocusClose: PropTypes.bool,
    disableCloseOnLocation: PropTypes.bool,
    disableCloseOnOnEscape: PropTypes.bool
};

export default Modal;
