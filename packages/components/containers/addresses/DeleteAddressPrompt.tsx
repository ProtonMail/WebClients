import type { PropsWithChildren } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Prompt from '@proton/components/components/prompt/Prompt';
import { useLoading } from '@proton/hooks';

import type { ModalProps } from '../../components';

interface Props extends ModalProps, PropsWithChildren {
    onDeleteAddress: () => Promise<void>;
    email: string;
    type?: 'permanent';
}

const DeleteAddressPrompt = ({ title, email, onDeleteAddress, children, type, ...rest }: Props) => {
    const [loading, withLoading] = useLoading();

    const address = (
        <strong key="address" className="text-break">
            {email}
        </strong>
    );

    return (
        <Prompt
            title={
                type === 'permanent'
                    ? c('Delete address prompt').t`Delete address permanently?`
                    : c('Delete address prompt').t`Delete address?`
            }
            open={rest.open}
            onClose={rest.onClose}
            buttons={[
                <Button
                    onClick={() => {
                        withLoading(onDeleteAddress().then(rest.onClose));
                    }}
                    loading={loading}
                    color="danger"
                >{c('Delete address prompt').t`Delete address`}</Button>,
                <Button onClick={rest.onClose} disabled={loading}>{c('Action').t`Cancel`}</Button>,
            ]}
        >
            {(() => {
                if (type === 'permanent') {
                    return (
                        <>
                            {c('Delete address prompt')
                                .jt`Once deleted, this address ${address} can't be used again by anyone else.`}
                            <br />
                            <br />
                            {c('Delete address prompt').t`You can only delete 1 address per year.`}
                        </>
                    );
                }
                return (
                    <>
                        {c('Delete address prompt')
                            .jt`Please note that if you delete this address ${address}, you will no longer be able to send or receive emails using this address.`}
                        <br />
                        <br />
                        {c('Delete address prompt').t`Are you sure you want to delete this address?`}
                    </>
                );
            })()}
            {type === 'permanent'}
            {children}
        </Prompt>
    );
};

export default DeleteAddressPrompt;
