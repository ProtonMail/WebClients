import { c } from 'ttag';

import { getKTActivation, userSettingsActions, useUserSettings } from '@proton/account';
import { Button } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import useLoading from '@proton/hooks/useLoading';
import { BRAND_NAME, KEYGEN_CONFIGS } from '@proton/shared/lib/constants';
import { ForwardingType } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import useNotifications from '../../../hooks/useNotifications';
import getPausedForwardingNotice from '../changePrimaryKeyForwardingNotice/getPausedForwardingNotice';
import { updateFlags } from '@proton/shared/lib/api/settings';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import useApi from '@proton/components/hooks/useApi';
import { resignSKLWithPrimaryKey } from '@proton/key-transparency/lib';
import { addAddressKeysProcess, addUserKeysProcess, getPrimaryAddressKeysForSigning } from '@proton/shared/lib/keys';
import { useUser } from '@proton/account/user/hooks';
import { useAddresses, useGetAddresses } from '@proton/account/addresses/hooks';
import { useUserKeys } from '@proton/account/userKeys/hooks';
import { useAddressesKeys } from '@proton/account/addressKeys/hooks';
import useKTVerifier from '../../keyTransparency/useKTVerifier';
import { useOutgoingAddressForwardings } from '@proton/mail/store/forwarding/hooks';
import useAuthentication from '@proton/components/hooks/useAuthentication';
import { useGetOrganizationKey } from '@proton/account/organizationKey/hooks';
import { useIsDeviceRecoveryAvailable, useIsDeviceRecoveryEnabled } from '@proton/components/hooks/useDeviceRecovery';

interface Props extends ModalProps {
}

const PostQuantumOptInModal = ({ ...rest }: Props) => {
    const { createNotification } = useNotifications();
    const [userSettings] = useUserSettings(); // loading state not needed since settings are prefetched in bootstrap
    const api = useApi();
    const [User] = useUser();
    const [Addresses, loadingAddresses] = useAddresses();
    const [userKeys] = useUserKeys();
    const [addressesKeys, loadingAddressesKeys] = useAddressesKeys();
    const createKTVerifier = useKTVerifier();
    const dispatch = useDispatch();
    const [outgoingAddressForwardings = [], loadingOutgoingAddressForwardings] = useOutgoingAddressForwardings();
    const authentication = useAuthentication();
    const getOrganizationKey = useGetOrganizationKey();
    const [isDeviceRecoveryAvailable, loadingDeviceRecovery] = useIsDeviceRecoveryAvailable();
    const isDeviceRecoveryEnabled = useIsDeviceRecoveryEnabled();
    const getAddresses = useGetAddresses();
    const [loading, withLoading, setLoading] = useLoading(loadingAddresses || loadingAddressesKeys || loadingOutgoingAddressForwardings || loadingDeviceRecovery);

    const handleOptIn = async () => {
        try {
            const updatedFlagSupportPgpV6Keys = { SupportPgpV6Keys: 1 as const };
            await api(updateFlags(updatedFlagSupportPgpV6Keys)).finally(() => {
                setLoading(false);
            });
            // optimistically update user settings without waiting for event loop;
            // this is done only after awaiting the API response since it will fail if the action is not authorized.
            dispatch(
                userSettingsActions.update({
                    UserSettings: { Flags: { ...userSettings.Flags, ...updatedFlagSupportPgpV6Keys } },
                })
            );
        } catch (error) {
            console.error(error);
            createNotification({
                text: c('PQC optin').t`Enabling post-quantum protection failed. Please try again later.`,
                type: 'error',
            });
            rest.onClose?.();
        }
    };
    const handleGenerateUserKey = async () => {
        if (!userKeys) {
            throw new Error('Missing keys');
        }
        const [addresses, organizationKey] = await Promise.all([getAddresses(), getOrganizationKey()]);

        try {
            await addUserKeysProcess({
                api,
                user: User,
                organizationKey,
                isDeviceRecoveryAvailable,
                isDeviceRecoveryEnabled,
                keyGenConfig: KEYGEN_CONFIGS.PQC,
                userKeys,
                addresses,
                passphrase: authentication.getPassword(),
            });
            createNotification({ text: c('PQC account key generation').t`Post-quantum account key successfully generated.` });
        } catch (error) {
            console.error(error);
            createNotification({
                text: c('PQC account key generation').t`Generating post-quantum account key failed.`,
                type: 'error',
            });
            rest.onClose?.();
        }
    }

    const handleGenerateAddressKeyForAllAddresses = async () => {
        if (!userKeys || !Addresses) {
            throw new Error('Missing address or user keys');
        }
        try {
            await Promise.all(Addresses.map(async Address => {
                const { ID: addressID = '', Email: addressEmail = '' } = Address || {};

                const addressWithKeys = addressesKeys?.find(({ address }) => address.ID === addressID);
                const addressKeys = addressWithKeys?.keys;
                if (!addressKeys) {
                    throw new Error('Missing address keys');
                }


                    const { keyTransparencyVerify, keyTransparencyCommit } = await createKTVerifier();
                    const [newKey, updatedActiveKeys, formerActiveKeys] = await addAddressKeysProcess({
                        api,
                        userKeys,
                        keyGenConfig: KEYGEN_CONFIGS.PQC,
                        addresses: Addresses,
                        address: Address,
                        addressKeys: addressKeys,
                        keyPassword: authentication.getPassword(),
                        keyTransparencyVerify,
                    });
                    await Promise.all([
                        resignSKLWithPrimaryKey({
                            api,
                            ktActivation: dispatch(getKTActivation()),
                            address: Address,
                            newPrimaryKeys: getPrimaryAddressKeysForSigning(updatedActiveKeys, true),
                            formerPrimaryKeys: getPrimaryAddressKeysForSigning(formerActiveKeys, true),
                            userKeys,
                        }),
                        keyTransparencyCommit(User, userKeys),
                    ]);
                    createNotification({ text: c('PQC address key generation').t`Post-quantum address key successfully generated for ${addressEmail}.` });
            }));

                // TODO use n-step modal for progress instead of notifications
                // with address key generation in last step, so that the "resumption button" can open the same one

        } catch (error) {
            console.error(error);
            createNotification({
                text: c('PQC address key generation').t`Generating post-quantum address keys failed for one or more addresses.`,
                type: 'error',
            });
            rest.onClose?.();
        }
    };

    const handleProcess = async () => {  
        setLoading(true);
        await handleOptIn();
        await handleGenerateUserKey();
        await handleGenerateAddressKeyForAllAddresses();
        rest.onClose?.();
    };

    return (
        <ModalTwo size="medium" {...rest}>
            <ModalTwoHeader title={c('PQC optin').t`Enable post-quantum protection`} />
            <ModalTwoContent>
                <div>
                    {(() => {
                        const hasOutgoingE2EEForwardingsAcrossAddresses = outgoingAddressForwardings.some(({ Type }) => Type === ForwardingType.InternalEncrypted);
                            return (
                                <>
                                    <div className="mb-2">
                                        {c('PQC account key generation')
                                            .t`This will generate a new post-quantum account key, which will be used to encrypt future contact details, email encryption keys, and other data.`}
                                    </div>
                                <div className="mb-2">
                                    {c('PQC address key generation')
                                        .t`It will also generate a new address key, which will be used to encrypt future draft emails, among other data. Email messages sent from other ${BRAND_NAME} user will also be encrypted using this key.`}
                                </div>
                                <div className="border rounded-lg p-4 flex flex-nowrap items-center mb-3 mt-4">
                                    <Icon name="exclamation-circle" className="shrink-0 color-warning" />
                                    <p className="text-sm color-weak flex-1 pl-4 my-0">{c('PQC compatibility warning')
                                        .t`After enabling post-quantum protection, you will no longer be able to login from older versions of ${BRAND_NAME} mobile apps.`}</p>
                                </div>
                                {hasOutgoingE2EEForwardingsAcrossAddresses && (
                                    <div className="border rounded-lg p-4 flex flex-nowrap items-center mb-3 mt-4">
                                        <Icon name="exclamation-circle" className="shrink-0 color-warning" />
                                        <p className="text-sm color-weak flex-1 pl-4 my-0">{getPausedForwardingNotice()}</p>
                                    </div>
                                )}
                            </>
                        );
                    })()}
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={rest.onClose}>{c('Action').t`Cancel`}</Button>
                <Button
                    color="norm"
                    loading={loading}
                    data-testid="confirm-pqc-opt-in"
                    onClick={() => {
                        void withLoading(handleProcess().catch(noop));
                    }}
                >
                    {c('PQC optin').t`Enable post-Quantum protection`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default PostQuantumOptInModal;
