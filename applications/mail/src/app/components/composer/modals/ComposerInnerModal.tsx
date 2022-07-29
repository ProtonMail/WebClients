import { ReactNode, useRef } from 'react';

import { c } from 'ttag';

import { Button, PrimaryButton, useFocusTrap, useHotkeys } from '@proton/components';

import InnerModalContent from './InnerModal/InnerModalContent';
import InnerModalFooter from './InnerModal/InnerModalFooter';
import InnerModalHeader from './InnerModal/InnerModalHeader';
import InnerModalScroll from './InnerModal/InnerModalScroll';

import './InnerModal/InnerModal.scss';

interface Props {
    title: ReactNode;
    disabled?: boolean;
    children?: ReactNode;
    onCancel: () => void;
    onSubmit?: () => void;
    submit?: ReactNode;
    submitActions?: ReactNode;
    displayCancel?: boolean;
}

const ComposerInnerModal = ({
    title,
    disabled = false,
    children,
    onCancel,
    onSubmit,
    submit,
    submitActions,
    displayCancel = true,
    ...rest
}: Props) => {
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
            className="composer-inner-modal absolute upper-layer w100 h100 flex flex-justify-center flex-align-items-center"
            ref={rootRef}
            {...focusTrapProps}
            {...rest}
        >
            <div className="inner-modal">
                <InnerModalHeader modalTitleID="" noEllipsis hasClose={false} onClose={onCancel}>
                    {title}
                </InnerModalHeader>
                <InnerModalContent onSubmit={onSubmit} onReset={onCancel}>
                    <InnerModalScroll>{children}</InnerModalScroll>
                    <InnerModalFooter className="flex flex-nowrap flex-column">
                        {submitActions}
                        {!submitActions && (
                            <PrimaryButton
                                type="submit"
                                disabled={disabled}
                                data-testid="modal-footer:set-button"
                                className="w100"
                            >
                                {submit || c('Action').t`Set`}
                            </PrimaryButton>
                        )}
                        {displayCancel && (
                            <Button type="reset" data-testid="modal-footer:cancel-button">
                                {c('Action').t`Cancel`}
                            </Button>
                        )}
                    </InnerModalFooter>
                </InnerModalContent>
            </div>
        </div>
    );
};

export default ComposerInnerModal;
