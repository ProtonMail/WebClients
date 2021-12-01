import DeleteAccountModal from '@proton/components/containers/account/DeleteAccountModal';
import broadcast, { MessageType } from '../broadcast';

const DeleteAccount = () => {
    const handleSuccess = async () => {
        broadcast({ type: MessageType.SUCCESS });
    };

    const handleClose = () => {
        broadcast({ type: MessageType.CLOSE });
    };

    return <DeleteAccountModal hideHeader fullscreen open onSuccess={handleSuccess} onClose={handleClose} />;
};

export default DeleteAccount;
