import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { type ModalProps, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import { BRAND_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import type { Address } from '@proton/shared/lib/interfaces/Address';

import { useDisconnectBYOEAddress } from '../../../byoe/useDisconnectBYOEAddress';

interface Props extends ModalProps {
    address: Address;
}

const DisconnectBYOEModal = ({ address, ...rest }: Props) => {
    const { disconnect, skipDisable, loading, isDisconnecting } = useDisconnectBYOEAddress(address);

    const handleSubmit = async () => {
        await disconnect();
        rest.onClose?.();
    };

    return (
        <ModalTwo size="small" {...rest}>
            {skipDisable ? (
                <ModalTwoHeader title={c('Title').t`Are you sure you want to disconnect this address?`} />
            ) : (
                <ModalTwoHeader title={c('Title').t`Are you sure you want to disconnect and disable this address?`} />
            )}
            <ModalTwoContent>
                {skipDisable ? (
                    <div>{c('Description')
                        .t`Once disconnected, you will no longer be able to send or receive emails as ${address.Email} in ${BRAND_NAME}. Emails sent to this address will still arrive in Gmail, but not in ${MAIL_APP_NAME}.`}</div>
                ) : (
                    <div>{c('Description')
                        .t`Once disconnected and disabled, you will no longer be able to send or receive emails as ${address.Email} in ${BRAND_NAME}. Emails sent to this address will still arrive in Gmail, but not in ${MAIL_APP_NAME}.`}</div>
                )}
                <div>{c('Description')
                    .t`Note that emails sent to this address, even from other ${BRAND_NAME} addresses, will no longer be end-to-end encrypted.`}</div>
                <div>{c('Description').t`You can reconnect this address at any time.`}</div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button className="w-full" onClick={rest.onClose} disabled={isDisconnecting}>{c('Action')
                    .t`Cancel`}</Button>
                <Button
                    color="danger"
                    className="w-full inline-flex items-center justify-center gap-2"
                    onClick={handleSubmit}
                    loading={loading}
                >
                    {c('Action').t`Disconnect`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default DisconnectBYOEModal;
