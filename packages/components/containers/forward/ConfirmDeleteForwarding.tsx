import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Prompt from '@proton/components/components/prompt/Prompt';
import { useLoading } from '@proton/hooks';

interface Props {
    reActivateE2EE: boolean;
    modalProps: ModalProps;
    onDelete: () => Promise<void>;
    onClose: () => void;
}

const ConfirmDeleteForwarding = ({ reActivateE2EE, onDelete, onClose, modalProps }: Props) => {
    const [loading, withLoading] = useLoading();

    return (
        <Prompt
            title={c('email_forwarding_2023: Title').t`Delete forwarding?`}
            buttons={[
                <Button color="danger" loading={loading} onClick={() => withLoading(onDelete())}>{c(
                    'email_forwarding_2023: Action'
                ).t`Delete`}</Button>,
                <Button autoFocus onClick={onClose}>{c('email_forwarding_2023: Action').t`Cancel`}</Button>,
            ]}
            {...modalProps}
        >
            <p>
                <span className="mr-1">{c('email_forwarding_2023: Prompt')
                    .t`Forwarding to the destination address will end.`}</span>
                {reActivateE2EE ? (
                    <span>{c('email_forwarding_2023: Prompt')
                        .t`End-to-end encryption will be re-enabled for the sender address.`}</span>
                ) : null}
            </p>
        </Prompt>
    );
};

export default ConfirmDeleteForwarding;
