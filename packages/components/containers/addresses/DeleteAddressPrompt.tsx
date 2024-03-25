import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { useLoading } from '@proton/hooks';

import { ModalProps, Prompt } from '../../components';

interface Props extends ModalProps {
    onDeleteAddress: () => Promise<void>;
}

const DeleteAddressPrompt = ({ onDeleteAddress, ...rest }: Props) => {
    const [loading, withLoading] = useLoading();

    return (
        <Prompt
            title={c('Title').t`Delete address permanently?`}
            open={rest.open}
            onClose={rest.onClose}
            buttons={[
                <Button
                    onClick={() => {
                        withLoading(onDeleteAddress().then(rest.onClose));
                    }}
                    loading={loading}
                    color="danger"
                >{c('Action').t`Delete address`}</Button>,
                <Button onClick={rest.onClose} disabled={loading}>{c('Action').t`Cancel`}</Button>,
            ]}
        >
            <p>{c('Delete address prompt').t`Once deleted, this address can't be used again by you or anyone else.`}</p>
            <p>{c('Delete address prompt').t`The next active address on your list will be set as the default.`}</p>
            <p>{c('Delete address prompt').t`You can only delete 1 address per year.`}</p>
        </Prompt>
    );
};

export default DeleteAddressPrompt;
