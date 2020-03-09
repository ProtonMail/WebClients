import React, { ReactNode } from 'react';
import { c } from 'ttag';
import { HeaderModal, FooterModal, ContentModal, InnerModal, ResetButton, PrimaryButton } from 'react-components';

interface Props {
    disabled?: boolean;
    children?: ReactNode;
    onCancel: () => void;
    onSubmit: () => void;
}

const ComposerInnerModal = ({ disabled = false, children, onCancel, onSubmit }: Props) => {
    return (
        <div className="composer-inner-modal absolute w100 h100 flex flex-justify-center flex-items-center">
            <div className="pm-modal">
                <HeaderModal modalTitleID="" onClose={onCancel}>
                    {c('Info').t`Encrypt for non-ProtonMail users`}
                </HeaderModal>
                <ContentModal onSubmit={onSubmit as () => undefined} onReset={onCancel as () => undefined}>
                    <InnerModal>{children}</InnerModal>
                    <FooterModal>
                        <ResetButton>{c('Action').t`Cancel`}</ResetButton>
                        <PrimaryButton type="submit" disabled={disabled}>{c('Action').t`Submit`}</PrimaryButton>
                    </FooterModal>
                </ContentModal>
            </div>
        </div>
    );
};

export default ComposerInnerModal;
