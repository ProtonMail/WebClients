import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Alert, AlertModal, ModalProps, PrimaryButton } from '@proton/components/components';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

interface Props extends ModalProps {
    attachmentsFoundKeyword: string;
    onResolve: () => void;
    onReject: () => void;
}

const NoAttachmentsModal = ({ attachmentsFoundKeyword, onResolve, onReject, ...rest }: Props) => {
    return (
        <AlertModal
            title={c('Title').t`No attachment found`}
            buttons={[
                <PrimaryButton onClick={onResolve}>{c('Action').t`Send anyway`}</PrimaryButton>,
                <Button onClick={onReject}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            <Alert learnMore={getKnowledgeBaseUrl('/attachment-reminders')}>
                {c('Info')
                    .t`You wrote “${attachmentsFoundKeyword}”, but no attachment has been added. Do you want to send your message anyway?`}
            </Alert>
        </AlertModal>
    );
};

export default NoAttachmentsModal;
