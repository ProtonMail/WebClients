import React, { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon, ModalProps, ModalTwoFooter, Tooltip } from '@proton/components/components';
import Dialog from '@proton/components/components/dialog/Dialog';
import { Portal } from '@proton/components/components/portal';
import { modalTwoRootClassName } from '@proton/shared/lib/busy';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import upsellImage from '@proton/styles/assets/img/illustrations/upsell-drive.png';
import clsx from '@proton/utils/clsx';

import './UpsellFloatingModal.scss';

interface Props extends ModalProps {
    onResolve: () => void;
    onReject: () => void;
    open: boolean;
    onlyOnce: boolean;
}

const UpsellFloatingModal = ({ onResolve, open, onlyOnce = false }: Props) => {
    const [wasOpened, setWasOpened] = useState(false);

    const handleClose = () => {
        onResolve();
        if (onlyOnce) {
            setWasOpened(true);
        }
    };
    if (!open || wasOpened) {
        return null;
    }
    return (
        <Portal>
            <div className={clsx(modalTwoRootClassName, 'upsell-floating-modal')}>
                <Dialog className="modal-two-dialog modal-two-dialog--small">
                    <div className="modal-two-dialog-container">
                        <div className="w100 flex flex-justify-center bg-weak">
                            <Tooltip
                                className="upsell-floating-modal-tooltip"
                                title={c('Action').t`Close`}
                                onClick={handleClose}
                            >
                                <Button className="flex-item-noshrink" icon shape="ghost" data-testid="modal:close">
                                    <Icon className="modal-close-icon" name="cross-big" alt={c('Action').t`Close`} />
                                </Button>
                            </Tooltip>
                            <img src={upsellImage} width="220" alt="" />
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
                            <Button className="w100" color="norm">{c('Action').t`Get ${DRIVE_APP_NAME}`}</Button>
                        </ModalTwoFooter>
                    </div>
                </Dialog>
            </div>
        </Portal>
    );
};

export default UpsellFloatingModal;
