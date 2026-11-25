import { type ReactNode, useContext } from 'react';

import { Button } from '@proton/atoms/Button/Button';
import { Pill } from '@proton/atoms/Pill/Pill';
import { ModalContext } from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import { ModalHeaderCloseButton } from '@proton/components/components/modalTwo/ModalHeader';
import clsx from '@proton/utils/clsx';

import { progressOf } from '../../../helpers/progressOf';
import {
    EasySwitchStepModalHost,
    useEasySwitchStepModalHost,
    useRegisterInEasySwitchStepModalHost,
} from './EasySwitchStepModalHost';

interface EasySwitchStepModalAction {
    label: string;
    onClick: () => void;
    disabled?: boolean;
}

interface EasySwitchStepModalProps {
    /** Position in the flow, shown as an "x of y" badge above the title. Leave it out for the steps outside the flow (errors, status). */
    step?: { current: number; total: number };
    title: ReactNode;
    /** Illustration shown in the side panel (above the content on mobile). */
    media: ReactNode;
    children?: ReactNode;
    primaryAction: EasySwitchStepModalAction;
    secondaryAction?: EasySwitchStepModalAction;
    onClose?: () => void;
    /** Disables the close button and closing with Escape: `onClose` is not called while it is set. */
    closeDisabled?: boolean;
    /** Set on the dialog when the step opens its own; inside an `EasySwitchStepModalHost`, set it on the host */
    'data-testid'?: string;
}

/** `dvh` follows the mobile browser toolbars; older supported browsers (Safari < 15.4) only have `vh` */
const VIEWPORT_HEIGHT = typeof CSS !== 'undefined' && CSS.supports?.('height', '100dvh') ? '100dvh' : '100vh';

/** The dialog is named by the element with the modal's id (aria-labelledby), so screen readers announce the title */
const EasySwitchStepModalTitle = ({ children }: { children: ReactNode }) => {
    const { id } = useContext(ModalContext);
    return (
        <h2 id={id} className="text-3xl sm:text-5xl text-bold lh120 mb-2 sm:mb-4 shrink-0">
            {children}
        </h2>
    );
};

/**
 * Shell for the steps of an Easy Switch import flow: content and actions on the left,
 * illustration panel on the right. Inside an `EasySwitchStepModalHost` it draws into the host's
 * dialog, so the modal stays open between steps; on its own it opens its own dialog.
 * Keep the `media` component type stable between steps that should not blink.
 */
export const EasySwitchStepModal = (props: EasySwitchStepModalProps) => {
    const {
        step,
        title,
        media,
        children,
        primaryAction,
        secondaryAction,
        onClose,
        closeDisabled,
        'data-testid': dataTestId,
    } = props;
    const host = useEasySwitchStepModalHost();
    useRegisterInEasySwitchStepModalHost(onClose, closeDisabled);

    if (!host) {
        // On its own, the step opens a host of its own, so both paths share one dialog setup
        return (
            <EasySwitchStepModalHost data-testid={dataTestId}>
                <EasySwitchStepModal {...props} />
            </EasySwitchStepModalHost>
        );
    }

    return (
        <>
            <ModalHeaderCloseButton
                buttonProps={{
                    className: 'absolute top-0 right-0 mt-4 mr-4 z-1',
                    disabled: closeDisabled,
                }}
            />
            {/* Same height on every step (520px in the design), so the modal doesn't jump between steps.
                Capped to the viewport (the backdrop's padding is at most 3.5em per side) so on a short
                window the content scrolls and the actions stay visible instead of being cut off. */}
            <div
                className="flex flex-column-reverse sm:flex-row flex-nowrap flex-auto min-h-0 sm:min-h-custom"
                style={{ '--sm-min-h-custom': `min(32.5rem, calc(${VIEWPORT_HEIGHT} - 7rem))` }}
            >
                <div className="flex flex-column flex-nowrap min-w-0 min-h-0 sm:w-1/2 px-6 pt-6 pb-6 sm:px-8 sm:pt-10 sm:pb-8">
                    {step && (
                        <div className="mb-4 sm:mb-6 shrink-0">
                            <Pill rounded="rounded-sm" className="text-xs">
                                {step && progressOf(step.current, step.total)}
                            </Pill>
                        </div>
                    )}
                    {/* Outside ModalContent, the dialog's description, so the title is not read twice */}
                    <EasySwitchStepModalTitle>{title}</EasySwitchStepModalTitle>
                    <ModalContent unstyled>{children}</ModalContent>
                    <div className="flex flex-nowrap justify-end gap-2 mt-6 sm:mt-8 shrink-0">
                        {secondaryAction && (
                            <Button
                                className="flex-1"
                                shape="ghost"
                                disabled={secondaryAction.disabled}
                                onClick={secondaryAction.onClick}
                            >
                                {secondaryAction.label}
                            </Button>
                        )}
                        <Button
                            className={clsx(secondaryAction && 'flex-1')}
                            color="norm"
                            disabled={primaryAction.disabled}
                            onClick={primaryAction.onClick}
                        >
                            {primaryAction.label}
                        </Button>
                    </div>
                </div>
                <div className="flex items-center justify-center shrink-0 sm:flex-1 m-2 sm:ml-0 rounded-lg bg-weak overflow-hidden">
                    {media}
                </div>
            </div>
        </>
    );
};
