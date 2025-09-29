import { c } from 'ttag';

import { updateBYOEAddressConnection } from '@proton/account/addressKeys/actions';
import { Button } from '@proton/atoms';
import { type ModalProps, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import { useLoading } from '@proton/hooks';
import { useDispatch } from '@proton/redux-shared-store';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import type { Address } from '@proton/shared/lib/interfaces';

interface Props extends ModalProps {
    address: Address;
}

const DisconnectBYOEModal = ({ address, ...rest }: Props) => {
    const { onClose } = rest;
    const [loading, withLoading] = useLoading(false);
    const dispatch = useDispatch();

    const handleSubmit = async () => {
        await dispatch(updateBYOEAddressConnection({ address, type: 'disconnect' }));

        onClose?.();
    };

    return (
        <ModalTwo size="small" {...rest}>
            <ModalTwoHeader title={c('loc_nightly: BYOE').t`Are you sure you want to disconnect this address?`} />
            <ModalTwoContent>
                <div>{c('loc_nightly: BYOE')
                    .t`You will no longer be able to use ${address.Email} to receive and send emails in ${BRAND_NAME}. Also note that messages sent to this address from ${BRAND_NAME} will no longer be end-to-end encrypted.`}</div>
                <div>{c('loc_nightly: BYOE').t`You can still login with this address and re-connect at any time.`}</div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button className="w-full" onClick={onClose} disabled={loading}>{c('Action').t`Cancel`}</Button>
                <Button
                    color="danger"
                    className="w-full inline-flex items-center justify-center gap-2"
                    onClick={() => withLoading(handleSubmit)}
                    loading={loading}
                >
                    {c('loc_nightly: BYOE').t`Disconnect`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default DisconnectBYOEModal;
