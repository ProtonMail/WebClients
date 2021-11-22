import PropTypes from 'prop-types';
import { c } from 'ttag';
import { noop } from '@proton/shared/lib/helpers/function';
import FooterModal from './Footer';
import DialogModal from './Dialog';
import HeaderModal from './Header';
import ContentModal from './Content';
import InnerModal from './Inner';
import { Button } from '../button';

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
    innerRef,
    hasSubmit = true,
    hasClose = true,
    displayTitle = true,
    noTitleEllipsis = false,
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
                <Button color="norm" loading={loading} type="submit" {...submitProps}>
                    {submit}
                </Button>
            ) : (
                submit
            );
        const submitBtn = hasSubmit ? nodeSubmit : null;

        return (
            <FooterModal>
                {typeof close === 'string' ? (
                    <Button type="reset" disabled={loading}>
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
                noEllipsis={noTitleEllipsis}
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
                <InnerModal ref={innerRef}>{children}</InnerModal>
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
    innerRef: PropTypes.object,
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
