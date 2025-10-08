import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import noop from '@proton/utils/noop';

import ContentModal from './Content';
import DialogModal, { type Props as DialogModalProps } from './Dialog';
import FooterModal from './Footer';
import HeaderModal from './Header';
import InnerModal from './Inner';

type Props = DialogModalProps & {
    modalTitleID?: string;
    onClose?: () => void;
    onSubmit?: () => void;
    title?: ReactNode;
    close?: ReactNode;
    submit?: ReactNode;
    loading?: boolean;
    children: ReactNode;
    footer?: ReactNode;
    innerRef?: any;
    hasSubmit?: boolean;
    hasClose?: boolean;
    displayTitle?: boolean;
    noTitleEllipsis?: boolean;
    noValidate?: boolean;
    mode?: string;
    submitProps?: any;
    closeProps?: any;
    disableCloseOnLocation?: boolean;
    disableCloseOnOnEscape?: boolean;
};

/**
 * @deprecated Please use ModalTwo instead
 * @type any
 */
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

    disableCloseOnLocation,
    disableCloseOnOnEscape,
    submitProps,
    closeProps,
    ...rest
}: Props) => {
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
                // @ts-ignore
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

export default Modal;
