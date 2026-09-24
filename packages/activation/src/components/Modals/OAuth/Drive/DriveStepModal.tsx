import type { ReactNode } from 'react';

import { Button } from '@proton/atoms/Button/Button';
import Modal, { type ModalSize } from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import { ModalHeaderCloseButton } from '@proton/components/components/modalTwo/ModalHeader';
import clsx from '@proton/utils/clsx';

interface Action {
    label: string;
    onClick: () => void;
    disabled?: boolean;
}

interface Props {
    onClose?: () => void;
    closeDisabled?: boolean;
    media: ReactNode;
    children: ReactNode;
    secondaryAction?: Action & { color?: 'weak' };
    primaryAction: Action;
    size?: ModalSize;
}

/** Shared shell for the Drive OAuth step modals: positioned close button, media, content, footer actions. */
export const DriveStepModal = ({
    onClose,
    closeDisabled,
    media,
    children,
    secondaryAction,
    primaryAction,
    size = 'xsmall',
}: Props) => (
    <Modal open={true} className="relative" onClose={onClose} size={size}>
        <ModalHeaderCloseButton
            buttonProps={{
                className: 'absolute right-custom top-custom',
                style: {
                    '--right-custom': '0.5rem',
                    '--top-custom': '0.5rem',
                },
                disabled: closeDisabled,
            }}
        />
        {media}
        <ModalContent className={clsx(size === 'xsmall' ? 'px-2' : 'px-1', 'pt-4')}>{children}</ModalContent>
        <ModalFooter className={`flex justify-end m-4 ${secondaryAction ? 'gap-2' : ''}`}>
            {secondaryAction && (
                <Button className="m-0" shape="ghost" color={secondaryAction.color} onClick={secondaryAction.onClick}>
                    {secondaryAction.label}
                </Button>
            )}
            <Button
                className="m-0"
                shape="solid"
                color="norm"
                disabled={primaryAction.disabled}
                onClick={primaryAction.onClick}
            >
                {primaryAction.label}
            </Button>
        </ModalFooter>
    </Modal>
);
