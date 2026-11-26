import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Prompt from '@proton/components/components/prompt/Prompt';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

interface Props extends ModalProps {
    onResolve: () => void;
    onReject: () => void;
}

/**
 * Asks before saving an attachment whose signature failed verification to Drive.
 */
const ConfirmSaveToDrive = ({ onResolve, onReject, ...rest }: Props) => {
    return (
        <Prompt
            title={c('Title').t`Verification error`}
            buttons={[
                <Button color="norm" onClick={onResolve}>{c('Action').t`Save`}</Button>,
                <Button onClick={onReject}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
            // Unlike download's prompt, Escape or a click outside counts as Cancel, so the save never waits forever
            onClose={onReject}
        >
            {c('Warning')
                .t`The attachment's signature failed verification. You can still save it to ${DRIVE_APP_NAME}, but it might have been tampered with.`}
            <br />
            <Href href={getKnowledgeBaseUrl('/digital-signature')}>{c('Link').t`Learn more`}</Href>
            <br />
            {c('Info').t`Do you want to save this attachment anyway?`}
        </Prompt>
    );
};

export default ConfirmSaveToDrive;
