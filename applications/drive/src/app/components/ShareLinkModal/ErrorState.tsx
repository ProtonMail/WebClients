import { Alert, Button, FooterModal, HeaderModal, InnerModal } from '@proton/components';
import { c } from 'ttag';

interface Props {
    modalTitleID: string;
    error: string;
    isCreationError: boolean;
    onClose?: () => void;
}

function ErrorState({ modalTitleID, error, isCreationError, onClose }: Props) {
    return (
        <>
            <HeaderModal modalTitleID={modalTitleID} onClose={onClose}>
                {c('Title').t`Manage secure link`}
            </HeaderModal>
            <div className="modal-content">
                <InnerModal>
                    <Alert type="error">
                        {isCreationError
                            ? c('Info').t`Failed to generate a secure link. Try again later.`
                            : c('Info').t`Failed to open a secure link. The reason is: ${error}`}
                    </Alert>
                </InnerModal>
                <FooterModal>
                    <Button onClick={onClose}>{c('Action').t`Done`}</Button>
                </FooterModal>
            </div>
        </>
    );
}

export default ErrorState;
