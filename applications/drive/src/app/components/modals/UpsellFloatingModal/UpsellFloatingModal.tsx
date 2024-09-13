import { useEffect, useLayoutEffect, useState } from 'react';

import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms';
import type { ModalProps } from '@proton/components';
import { DriveLogo, Icon, Tooltip, useModalTwoStatic } from '@proton/components';
import Dialog from '@proton/components/components/dialog/Dialog';
import { Portal } from '@proton/components/components/portal';
import { isProtonUserFromCookie } from '@proton/components/helpers/protonUserCookie';
import { useActiveBreakpoint } from '@proton/components/hooks';
import usePrevious from '@proton/hooks/usePrevious';
import { modalTwoRootClassName } from '@proton/shared/lib/busy';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import { DRIVE_SIGNUP } from '@proton/shared/lib/drive/urls';
import clsx from '@proton/utils/clsx';

import { useDownload } from '../../../store';

import './UpsellFloatingModal.scss';

interface ChildProps {
    open: boolean;
    onClose: () => void;
    onExit: () => void;
}

const UpsellFloatingModalContent = ({ onClose }: Pick<ChildProps, 'onClose'>) => {
    return (
        <div className="upsell-floating-modal-container relative">
            <Tooltip
                className="upsell-floating-modal-tooltip absolute right-0 top-0 mr-1"
                title={c('Action').t`Close`}
                onClick={onClose}
            >
                <Button className="shrink-0" icon shape="ghost" data-testid="upsell-floating-modal:close">
                    <Icon className="modal-close-icon" name="cross-big" alt={c('Action').t`Close`} />
                </Button>
            </Tooltip>
            <div className="py-3 px-4">
                <div className="flex flex-nowrap items-center gap-2">
                    <DriveLogo variant="glyph-only" />
                    <div className="flex-1">
                        <h4 className="text-bold">{c('Info').t`Try ${DRIVE_APP_NAME}: Free forever`}</h4>
                        <div className="flex flex-nowrap items-center gap-6">
                            <p className="m-0 mt-1 flex-1 max-w-custom" style={{ '--max-w-custom': '12.5em' }}>
                                {c('Info').t`With ${DRIVE_APP_NAME} your data is protected by end-to-end encryption.`}
                            </p>
                            <ButtonLike as="a" href={DRIVE_SIGNUP} target="_blank" color="norm" shape="outline">{c(
                                'Action'
                            ).t`Get Started`}</ButtonLike>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

enum ExitState {
    idle,
    exiting,
    exited,
}

const UpsellFloatingModal = ({ open, onClose }: ChildProps & ModalProps) => {
    const [exit, setExit] = useState(() => (open ? ExitState.idle : ExitState.exited));
    const active = exit !== ExitState.exited;
    const previousOpen = usePrevious(open);
    const { hasDownloads } = useDownload();

    // Hide Upsell if download is in progress
    useEffect(() => {
        if (hasDownloads) {
            onClose();
            setExit(ExitState.exited);
        }
    }, [onClose, hasDownloads]);

    useLayoutEffect(() => {
        if (!previousOpen && open) {
            setExit(ExitState.idle);
        } else if (previousOpen && !open) {
            setExit(ExitState.exiting);
        }
    }, [previousOpen, open, active]);

    if (!active) {
        return null;
    }

    const exiting = exit === ExitState.exiting;
    return (
        <Portal>
            <div
                className={clsx(
                    modalTwoRootClassName,
                    'upsell-floating-modal mr-4 mb-2 p-0',
                    exiting && 'modal-two--out'
                )}
                onAnimationEnd={({ animationName }) => {
                    if (exiting && animationName === 'anime-modal-two-out') {
                        setExit(ExitState.exited);
                    }
                }}
                data-testid="upsell-floating-modal"
            >
                <Dialog className="modal-two-dialog upsell-floating-modal-dialog border border-primary rounded">
                    <div className="modal-two-dialog-container">
                        <UpsellFloatingModalContent onClose={onClose} />
                    </div>
                </Dialog>
            </div>
        </Portal>
    );
};

export default UpsellFloatingModal;

export const useUpsellFloatingModal = () => {
    const [renderUpsellFloatingModal, showUpsellFloatingModal] = useModalTwoStatic(UpsellFloatingModal);

    const { viewportWidth } = useActiveBreakpoint();

    // If user is proton user or on mobile we disable upsell modal
    const hideModal = viewportWidth['<=small'] || isProtonUserFromCookie();

    useEffect(() => {
        if (hideModal) {
            return;
        }
        showUpsellFloatingModal({});
    }, [hideModal, showUpsellFloatingModal]);

    return [hideModal ? null : renderUpsellFloatingModal, showUpsellFloatingModal] as const;
};
