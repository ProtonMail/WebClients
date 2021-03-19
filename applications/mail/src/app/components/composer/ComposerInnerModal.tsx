import React, { ReactNode, useRef } from 'react';
import { c } from 'ttag';
import {
    HeaderModal,
    FooterModal,
    ContentModal,
    InnerModal,
    Button,
    PrimaryButton,
    useFocusTrap,
    useHotkeys,
} from 'react-components';

interface Props {
    title: ReactNode;
    disabled?: boolean;
    children?: ReactNode;
    onCancel: () => void;
    onSubmit: () => void;
}

const ComposerInnerModal = ({ title, disabled = false, children, onCancel, onSubmit }: Props) => {
    const rootRef = useRef<HTMLDivElement>(null);
    const focusTrapProps = useFocusTrap({
        rootRef,
    });

    useHotkeys(rootRef, [
        [
            'Escape',
            (e) => {
                e.stopPropagation();
                onCancel?.();
            },
        ],
    ]);

    return (
        <div
            className="composer-inner-modal absolute w100 h100 flex flex-justify-center flex-align-items-center"
            ref={rootRef}
            {...focusTrapProps}
        >
            <div className="modal">
                <HeaderModal modalTitleID="" hasClose={false} onClose={onCancel}>
                    {title}
                </HeaderModal>
                <ContentModal onSubmit={onSubmit as () => undefined} onReset={onCancel as () => undefined}>
                    <InnerModal>{children}</InnerModal>
                    <FooterModal>
                        <Button type="reset">{c('Action').t`Cancel`}</Button>
                        <PrimaryButton type="submit" disabled={disabled}>{c('Action').t`Set`}</PrimaryButton>
                    </FooterModal>
                </ContentModal>
            </div>
        </div>
    );
};

export default ComposerInnerModal;
