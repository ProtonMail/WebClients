import { useRef } from 'react';

import DeleteAccountModal from '@proton/components/containers/account/DeleteAccountModal';

import broadcast, { MessageType } from '../broadcast';

const DeleteAccount = () => {
    const successRef = useRef(false);

    const handleSuccess = async () => {
        successRef.current = true;
        broadcast({ type: MessageType.SUCCESS });
    };

    const handleClose = () => {
        // If the account has been successfully deleted, we explicitly don't send a close message, because of the
        // particularity with deleting the account where the session is signed out afterwards. So we rely on the
        // main logout handler to send the CLOSE message.
        if (successRef.current) {
            return;
        }
        broadcast({ type: MessageType.CLOSE });
    };

    return (
        <DeleteAccountModal
            hideHeader
            fullscreen
            open
            onSuccess={handleSuccess}
            // The lite app does not need to redirect to or deal with logout afterwards
            disableLogout={true}
            onClose={handleClose}
        />
    );
};

export default DeleteAccount;
