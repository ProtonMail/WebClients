import { MouseEvent as ReactMouseEvent, useLayoutEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms/Button';
import { Icon, ModalStateProps, ModalTwo, ModalTwoFooter, Tooltip } from '@proton/components/components';
import Dialog from '@proton/components/components/dialog/Dialog';
import { Portal } from '@proton/components/components/portal';
import { useActiveBreakpoint } from '@proton/components/hooks';
import usePrevious from '@proton/hooks/usePrevious';
import { modalTwoRootClassName } from '@proton/shared/lib/busy';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import { DRIVE_PRICING_PAGE } from '@proton/shared/lib/drive/urls';
import bigLogoWhite from '@proton/styles/assets/img/drive/big-logo-white.svg';
import clsx from '@proton/utils/clsx';

import './UpsellFloatingModal.scss';

interface ChildProps {
    open: boolean;
    onClose: () => void;
    onBlockNewOpening: () => void;
}

const UpsellFloatingModalContent = ({ onClose }: Pick<ChildProps, 'onClose'>) => {
    return (
        <>
            <div className="upsell-floating-modal-content w-full flex justify-center p-14">
                <Tooltip className="upsell-floating-modal-tooltip" title={c('Action').t`Close`} onClick={onClose}>
                    <Button className="flex-item-noshrink" icon shape="ghost" data-testid="modal:close">
                        <Icon className="modal-close-icon" name="cross-big" alt={c('Action').t`Close`} />
                    </Button>
                </Tooltip>
                <img className="block" src={bigLogoWhite} alt={DRIVE_APP_NAME} />
            </div>
            <div className="my-4 mx-5">
                <span className="upsell-floating-modal-badge text-semibold rounded py-1 px-4 mt-2">{c('Info')
                    .t`Free forever`}</span>
                <h4 className="text-bold mt-3">{c('Info').t`Swiss encrypted file storage`}</h4>
                <p className="m-0 mt-1">
                    {c('Info')
                        .t`With ${DRIVE_APP_NAME}, your data is protected with end-to-end encryption. Only you can decrypt it.`}
                </p>
            </div>
            <ModalTwoFooter>
                <ButtonLike as="a" href={DRIVE_PRICING_PAGE} target="_blank" className="w-full" color="norm">{c('Action')
                    .t`Get ${DRIVE_APP_NAME}`}</ButtonLike>
            </ModalTwoFooter>
        </>
    );
};

enum ExitState {
    idle,
    exiting,
    exited,
}
const DesktopUpsellFloatingModal = ({ open, onClose, onBlockNewOpening }: ChildProps) => {
    const [exit, setExit] = useState(() => (open ? ExitState.idle : ExitState.exited));
    const active = exit !== ExitState.exited;
    const previousOpen = usePrevious(open);

    useLayoutEffect(() => {
        if (!previousOpen && open) {
            setExit(ExitState.idle);
        } else if (previousOpen && !open) {
            setExit(ExitState.exiting);
        } else if (!previousOpen && !open && !active) {
            onBlockNewOpening();
        }
    }, [previousOpen, open, active]);

    if (!active) {
        return null;
    }

    const exiting = exit === ExitState.exiting;
    return (
        <Portal>
            <div
                className={clsx(modalTwoRootClassName, 'upsell-floating-modal', exiting && 'modal-two--out')}
                onAnimationEnd={({ animationName }) => {
                    if (exiting && animationName === 'anime-modal-two-out') {
                        setExit(ExitState.exited);
                    }
                }}
            >
                <Dialog className="modal-two-dialog upsell-floating-modal-dialog ">
                    <div className="modal-two-dialog-container">
                        <UpsellFloatingModalContent onClose={onClose} />
                    </div>
                </Dialog>
            </div>
        </Portal>
    );
};

const MobileUpsellFloatingModal = ({ open, onClose, onBlockNewOpening }: ChildProps) => {
    const ref = useRef<HTMLDivElement>(null);

    const handleClose = () => {
        onClose();
        onBlockNewOpening();
    };

    // We listen for click outside and test if the click will contain the ref
    const handleOutsideClick = (e: ReactMouseEvent<HTMLDivElement, MouseEvent>) => {
        if (e.target && !ref.current?.contains(e.target as Element)) {
            handleClose();
        }
    };

    return (
        // TODO: need to find a better way than put a click on div
        <div onClick={handleOutsideClick}>
            <ModalTwo open={open} onClose={handleClose}>
                <div ref={ref}>
                    <UpsellFloatingModalContent onClose={handleClose} />
                </div>
            </ModalTwo>
        </div>
    );
};

interface Props {
    onResolve: () => void;
    onlyOnce: boolean;
}
const UpsellFloatingModal = ({ onlyOnce = false, ...modalProps }: Props & ModalStateProps) => {
    const { isNarrow } = useActiveBreakpoint();
    const [wasOpened, setWasOpened] = useState(false);

    const handleBlockNewOpening = () => {
        if (onlyOnce) {
            setWasOpened(true);
        }
    };

    const props = {
        ...modalProps,
        onBlockNewOpening: handleBlockNewOpening,
    };

    if (wasOpened) {
        return null;
    }

    if (isNarrow) {
        return <MobileUpsellFloatingModal {...props} />;
    }

    return <DesktopUpsellFloatingModal {...props} />;
};

export default UpsellFloatingModal;
