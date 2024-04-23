import { PropsWithChildren } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { useLoading } from '@proton/hooks';

import { ModalProps, Prompt } from '../../components';
import { getDeleteText } from '../general/helper';

interface Props extends ModalProps, PropsWithChildren {
    onDeleteAddress: () => Promise<void>;
    email?: string;
}

const DeleteAddressPrompt = ({ email, onDeleteAddress, children, ...rest }: Props) => {
    const [loading, withLoading] = useLoading();

    return (
        <Prompt
            title={email ? getDeleteText(email) : c('Title').t`Delete address permanently?`}
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
            {children}
        </Prompt>
    );
};

export default DeleteAddressPrompt;
