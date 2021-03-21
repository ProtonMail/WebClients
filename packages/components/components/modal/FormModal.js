import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { noop } from 'proton-shared/lib/helpers/function';
import FooterModal from './Footer';
import DialogModal from './Dialog';
import HeaderModal from './Header';
import ContentModal from './Content';
import InnerModal from './Inner';
import { Button, PrimaryButton } from '../button';

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
    displayTitle = true,
    noValidate = false,
    mode = '',
    // Destructure these options so they are not passed to the DOM.
    // eslint-disable-next-line no-unused-vars,@typescript-eslint/no-unused-vars
    disableCloseOnLocation,
    disableCloseOnOnEscape,
    submitProps,
    closeProps,
    ...rest
}) => {
    // Because we will forget
    if (!['isClosing', 'isBehind', 'onExit'].every((key) => rest.hasOwnProperty.call(rest, key))) {
        // eslint-disable-next-line no-console
        console.warn(`
You must pass props to <FormModal ...rest>,
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

    const isAlertMode = mode === 'alert';

    const getFooter = () => {
        if (footer === null) {
            return null;
        }

        if (footer) {
            return <FooterModal isColumn={isAlertMode}>{footer}</FooterModal>;
        }

        if (isAlertMode) {
            return (
                <FooterModal isColumn>
                    <Button
                        size="large"
                        color="norm"
                        type="button"
                        fullWidth
                        loading={loading}
                        onClick={onSubmit}
                        data-focus-fallback="-1"
                        {...submitProps}
                    >
                        {submit}
                    </Button>
                    {close ? (
                        <Button
                            size="large"
                            color="weak"
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            fullWidth
                            data-focus-fallback="-2"
                            {...closeProps}
                        >
                            {close}
                        </Button>
                    ) : null}
                </FooterModal>
            );
        }

        const nodeSubmit =
            typeof submit === 'string' ? (
                <PrimaryButton loading={loading} type="submit" data-focus-fallback="-1">
                    {submit}
                </PrimaryButton>
            ) : (
                submit
            );
        const submitBtn = hasSubmit ? nodeSubmit : null;

        return (
            <FooterModal>
                {typeof close === 'string' ? (
                    <Button type="reset" disabled={loading} data-focus-fallback="-2">
                        {close}
                    </Button>
                ) : (
                    close
                )}
                {submitBtn}
            </FooterModal>
        );
    };

    return (
        <DialogModal
            onClose={onClose}
            modalTitleID={modalTitleID}
            disableCloseOnOnEscape={disableCloseOnOnEscape || loading}
            {...rest}
            {...(isAlertMode ? { small: false, tiny: true } : {})}
        >
            <HeaderModal
                hasClose={hasClose}
                displayTitle={displayTitle}
                modalTitleID={modalTitleID}
                onClose={onClose}
                {...(isAlertMode ? { hasClose: false } : {})}
            >
                {title}
            </HeaderModal>
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
    mode: PropTypes.string,
    small: PropTypes.bool,
    background: PropTypes.bool,
    hasSubmit: PropTypes.bool,
    hasClose: PropTypes.bool,
    disableCloseOnLocation: PropTypes.bool,
    disableCloseOnOnEscape: PropTypes.bool,
};

export default Modal;
