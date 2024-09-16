import { c } from 'ttag';

import { Button, Href } from '@proton/atoms';
import type { ModalProps } from '@proton/components';
import { Alert, PrimaryButton, Prompt } from '@proton/components';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

interface Props extends ModalProps {
    attachmentsFoundKeyword: string;
    onResolve: () => void;
    onReject: () => void;
}

const NoAttachmentsModal = ({ attachmentsFoundKeyword, onResolve, onReject, ...rest }: Props) => {
    return (
        <Prompt
            title={c('Title').t`No attachment found`}
            buttons={[
                <PrimaryButton onClick={onResolve}>{c('Action').t`Send anyway`}</PrimaryButton>,
                <Button onClick={onReject}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            <Alert>
                {c('Info')
                    .t`You wrote “${attachmentsFoundKeyword}”, but no attachment has been added. Do you want to send your message anyway?`}
                <div>
                    <Href href={getKnowledgeBaseUrl('/attachment-reminders')}>{c('Link').t`Learn more`}</Href>
                </div>
            </Alert>
        </Prompt>
    );
};

export default NoAttachmentsModal;
