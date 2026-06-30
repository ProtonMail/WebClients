import { c } from 'ttag';

import { updateBYOEAddressConnection } from '@proton/account/addressKeys/actions';
import { useAddresses } from '@proton/account/addresses/hooks';
import { useOrganization } from '@proton/account/organization/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { type ModalProps, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import { useLoading } from '@proton/hooks';
import { isMultiUserPersonalPlan } from '@proton/payments/core/plan/helpers';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { BRAND_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { getIsBYOEOnlyAccount } from '@proton/shared/lib/helpers/address';
import type { Address } from '@proton/shared/lib/interfaces';
import { isAdmin } from '@proton/shared/lib/user/helpers';

import { useEasySwitchDispatch } from '../../../logic/store';
import { loadSyncList } from '../../../logic/sync/sync.actions';

interface Props extends ModalProps {
    address: Address;
}

const DisconnectBYOEModal = ({ address, ...rest }: Props) => {
    const { onClose } = rest;
    const [loading, withLoading] = useLoading(false);
    const dispatch = useDispatch();
    const easySwitchDispatch = useEasySwitchDispatch();
    const [user] = useUser();
    const [organization] = useOrganization();
    const [addresses] = useAddresses();

    // The disable request needs the organisation scope, which non-admin members of a family plan
    // don't have. It's also impossible to disable your only address. In both cases the disconnect
    // runs without the disable step.
    const isBYOEOnlyAccount = getIsBYOEOnlyAccount(addresses);
    const isFamilyMember = !!organization?.PlanName && isMultiUserPersonalPlan(organization.PlanName) && !isAdmin(user);
    const skipDisable = isBYOEOnlyAccount || isFamilyMember;

    const handleSubmit = async () => {
        await dispatch(updateBYOEAddressConnection({ address, type: 'disconnect', skipDisable }));
        // also update the syncs list
        void easySwitchDispatch(loadSyncList());

        onClose?.();
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
                <Button className="w-full" onClick={onClose} disabled={loading}>{c('Action').t`Cancel`}</Button>
                <Button
                    color="danger"
                    className="w-full inline-flex items-center justify-center gap-2"
                    onClick={() => withLoading(handleSubmit)}
                    loading={loading}
                >
                    {c('Action').t`Disconnect`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default DisconnectBYOEModal;
