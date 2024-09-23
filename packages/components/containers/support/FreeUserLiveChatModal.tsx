import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { PLANS, PLAN_NAMES } from '@proton/shared/lib/constants';

import AuthenticatedBugModal from '../support/AuthenticatedBugModal';

export interface Props {
    onClose: ModalProps['onClose'];
    onExit: ModalProps['onExit'];
    open: ModalProps['open'];
}

const FreeUserLiveChatModal = ({ open, onExit, onClose }: Props) => {
    const handleClose = onClose;
    const [bugReportModal, setBugReportModal, render] = useModalState();

    const handleBugReportClick = () => {
        setBugReportModal(true);
    };

    const onCloseChildModal = () => {
        bugReportModal.onClose();
        handleClose?.();
    };

    const planName = PLAN_NAMES[PLANS.VPN];

    return (
        <>
            {render && <AuthenticatedBugModal {...bugReportModal} onClose={onCloseChildModal} />}
            <Modal open={open} onExit={onExit} onClose={handleClose} size="small">
                <ModalHeader />
                <ModalContent className="flex flex-column items-center mb-8">
                    <div className="flex flex-row justify-center items-center p-4 rounded-full bg-weak">
                        <Icon name="speech-bubble" size={5} className="color-primary" />
                    </div>
                    <h3 className="text-3xl color-primary text-center mt-4 mb-1">
                        {c('Live Chat Modal').t`Live chat is available with ${planName}`}
                    </h3>
                    <p className="text-center text-lg color-weak">
                        {c('Live Chat Modal')
                            .t`Upgrade to unlock chat support and other premium features, or use our free support form to report your issue.`}
                    </p>
                    <ButtonLike
                        as={SettingsLink}
                        className="text-bold mt-8"
                        size="small"
                        pill
                        color="norm"
                        path={`/dashboard?plan=${PLANS.VPN2024}&cycle=1`}
                        onClick={handleClose}
                    >
                        {c('Live Chat Modal').t`Upgrade subscription`}
                    </ButtonLike>
                    <Button
                        shape="ghost"
                        pill
                        size="small"
                        className="color-primary mt-4 text-bold"
                        onClick={handleBugReportClick}
                    >{c('Live Chat Modal').t`Open support form`}</Button>
                </ModalContent>
            </Modal>
        </>
    );
};

export default FreeUserLiveChatModal;
