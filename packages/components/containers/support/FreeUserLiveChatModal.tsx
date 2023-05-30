import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms';
import { PLANS, PLAN_NAMES } from '@proton/shared/lib/constants';

import {
    Icon,
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoHeader as ModalHeader,
    ModalProps,
    SettingsLink,
    useModalState,
} from '../../components';
import { AuthenticatedBugModal } from '../support';

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
                <ModalContent className="flex flex-column flex-align-items-center mb-8">
                    <div className="flex flex-row flex-justify-center flex-align-items-center p-4 rounded-full bg-weak">
                        <Icon name="speech-bubble" size={20} className="color-primary" />
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
                        path={`/dashboard?plan=${PLANS.VPN}&cycle=1`}
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
