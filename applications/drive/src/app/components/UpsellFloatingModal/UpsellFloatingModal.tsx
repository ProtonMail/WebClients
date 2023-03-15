import { MouseEvent as ReactMouseEvent, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms/Button';
import { Icon, ModalProps, ModalTwo, ModalTwoFooter, Tooltip } from '@proton/components/components';
import Dialog from '@proton/components/components/dialog/Dialog';
import { Portal } from '@proton/components/components/portal';
import { useActiveBreakpoint } from '@proton/components/hooks';
import { modalTwoRootClassName } from '@proton/shared/lib/busy';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import bigLogoWhite from '@proton/styles/assets/img/drive/big-logo-white.svg';
import clsx from '@proton/utils/clsx';

import { DRIVE_LANDING_PAGE } from '../SharedPage/constant';

import './UpsellFloatingModal.scss';

interface Props extends ModalProps {
    onResolve: () => void;
    onReject: () => void;
    open: boolean;
    onlyOnce: boolean;
}

const UpsellFloaingModalContent = ({ onClose }: { onClose: () => void }) => {
    return (
        <>
            <div className="upsell-floating-modal-content w100 flex flex-justify-center p5">
                <Tooltip className="upsell-floating-modal-tooltip" title={c('Action').t`Close`} onClick={onClose}>
                    <Button className="flex-item-noshrink" icon shape="ghost" data-testid="modal:close">
                        <Icon className="modal-close-icon" name="cross-big" alt={c('Action').t`Close`} />
                    </Button>
                </Tooltip>
                <img className="block" src={bigLogoWhite} alt={DRIVE_APP_NAME} />
            </div>
            <div className="m1 ml1-5 mr1-5">
                <span className="upsell-floating-modal-badge text-semibold rounded pt0-25 pb0-25 pl1 pr1 mt0-5">{c(
                    'Info'
                ).t`Free forever`}</span>
                <h4 className="text-bold mt0-75">{c('Info').t`Swiss encrypted file storage`}</h4>
                <p className="m0 mt0-25">
                    {c('Info')
                        .t`With ${DRIVE_APP_NAME}, your data is protected with end-to-end encryption. Only you can decrypt it.`}
                </p>
            </div>
            <ModalTwoFooter>
                <ButtonLike as="a" href={DRIVE_LANDING_PAGE} target="_blank" className="w100" color="norm">{c('Action')
                    .t`Get ${DRIVE_APP_NAME}`}</ButtonLike>
            </ModalTwoFooter>
        </>
    );
};

const UpsellFloatingModal = ({ onResolve, open, onlyOnce = false }: Props) => {
    const { isNarrow } = useActiveBreakpoint();
    const [wasOpened, setWasOpened] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const handleClose = () => {
        onResolve();
        if (onlyOnce) {
            setWasOpened(true);
        }
    };

    const handleOutsideClick = (e: ReactMouseEvent<HTMLDivElement, MouseEvent>) => {
        if (e.target && !ref.current?.contains(e.target as Element)) {
            handleClose();
        }
    };

    if (!open || wasOpened) {
        return null;
    }

    if (isNarrow) {
        // We listen for click outside and test if the click will contain the ref
        return (
            <div onClick={handleOutsideClick}>
                <ModalTwo open onClose={handleClose}>
                    <div ref={ref}>
                        <UpsellFloaingModalContent onClose={handleClose} />
                    </div>
                </ModalTwo>
            </div>
        );
    }

    return (
        <Portal>
            <div className={clsx(modalTwoRootClassName, 'upsell-floating-modal')}>
                <Dialog className="modal-two-dialog modal-two-dialog--small">
                    <div className="modal-two-dialog-container">
                        <UpsellFloaingModalContent onClose={handleClose} />
                    </div>
                </Dialog>
            </div>
        </Portal>
    );
};

export default UpsellFloatingModal;
