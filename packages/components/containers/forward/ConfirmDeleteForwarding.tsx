import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { useLoading } from '@proton/hooks';

import { ModalProps, Prompt } from '../../components';

interface Props {
    modalProps: ModalProps;
    onDelete: () => Promise<void>;
    onClose: () => void;
}

const ConfirmDeleteForwarding = ({ onDelete, onClose, modalProps }: Props) => {
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
            <p>{c('email_forwarding_2023: Prompt').t`Forwarding to the destination address will end.`}</p>
        </Prompt>
    );
};

export default ConfirmDeleteForwarding;
