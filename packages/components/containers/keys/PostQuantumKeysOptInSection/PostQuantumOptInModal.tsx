import { useState } from 'react';

import { c } from 'ttag';

import {
    addressKeysThunk,
    addressesThunk,
    getKTActivation,
    organizationKeyThunk,
    userKeysThunk,
    userSettingsActions,
    userThunk,
} from '@proton/account';
import { Button } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import useApi from '@proton/components/hooks/useApi';
import useAuthentication from '@proton/components/hooks/useAuthentication';
import { useIsDeviceRecoveryAvailable, useIsDeviceRecoveryEnabled } from '@proton/components/hooks/useDeviceRecovery';
import { resignSKLWithPrimaryKey } from '@proton/key-transparency/lib';
import { useOutgoingAddressForwardings } from '@proton/mail/store/forwarding/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { CacheType } from '@proton/redux-utilities';
import { updateFlags } from '@proton/shared/lib/api/settings';
import { BRAND_NAME, KEYGEN_CONFIGS } from '@proton/shared/lib/constants';
import { ForwardingState, ForwardingType } from '@proton/shared/lib/interfaces';
import { addAddressKeysProcess, addUserKeysProcess, getPrimaryAddressKeysForSigning } from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';

import useNotifications from '../../../hooks/useNotifications';
import useKTVerifier from '../../keyTransparency/useKTVerifier';
import getPausedForwardingNotice from '../changePrimaryKeyForwardingNotice/getPausedForwardingNotice';

interface Props extends ModalProps {}

const PostQuantumOptInModal = ({ ...rest }: Props) => {
    const { createNotification } = useNotifications();
    const api = useApi();
    const createKTVerifier = useKTVerifier();
    const dispatch = useDispatch();
    const [outgoingAddressForwardings = [], loadingOutgoingAddressForwardings] = useOutgoingAddressForwardings();
    const authentication = useAuthentication();
    const [isDeviceRecoveryAvailable, loadingDeviceRecovery] = useIsDeviceRecoveryAvailable();
    const isDeviceRecoveryEnabled = useIsDeviceRecoveryEnabled();

    const loadingDependencies = loadingOutgoingAddressForwardings || loadingDeviceRecovery;
    const [loading, setLoading] = useState(false);

    const handleOptIn = async () => {
        try {
            const updatedFlagSupportPgpV6Keys = { SupportPgpV6Keys: 1 } as const;
            await api(updateFlags(updatedFlagSupportPgpV6Keys));
            // optimistically update user settings without waiting for event loop;
            // this is done only after awaiting the API response since it will fail if the action is not authorized.
            dispatch(userSettingsActions.update({ UserSettings: { Flags: updatedFlagSupportPgpV6Keys } }));
        } catch (error) {
            console.error(error);
            createNotification({
                text: c('PQC optin').t`Enabling post-quantum protection failed. Please try again later.`,
                type: 'error',
            });
        }
    };
    const handleGenerateUserKey = async () => {
        const [user, userKeys, addresses, organizationKey] = await Promise.all([
            dispatch(userThunk()),
            dispatch(userKeysThunk()),
            dispatch(addressesThunk()),
            dispatch(organizationKeyThunk()),
        ]);

        try {
            await addUserKeysProcess({
                api,
                user,
                organizationKey,
                isDeviceRecoveryAvailable,
                isDeviceRecoveryEnabled,
                keyGenConfig: KEYGEN_CONFIGS.PQC,
                userKeys,
                addresses,
                passphrase: authentication.getPassword(),
            });
            await dispatch(userThunk({ cache: CacheType.None })); // Ensures user keys is up to date.
            createNotification({
                text: c('PQC account key generation').t`Post-quantum account key successfully generated.`,
            });
        } catch (error) {
            console.error(error);
            createNotification({
                text: c('PQC account key generation').t`Generating post-quantum account key failed.`,
                type: 'error',
            });
        }
    };

    const handleGenerateAddressKeyForAllAddresses = async () => {
        const [user, userKeys, addresses] = await Promise.all([
            dispatch(userThunk()),
            dispatch(userKeysThunk()),
            dispatch(addressesThunk()),
        ]);
        try {
            await Promise.all(
                addresses.map(async (address) => {
                    const { ID: addressID = '', Email: addressEmail = '' } = address || {};
                    const addressKeys = await dispatch(addressKeysThunk({ addressID }));
                    const { keyTransparencyVerify, keyTransparencyCommit } = await createKTVerifier();
                    const [, updatedActiveKeys, formerActiveKeys] = await addAddressKeysProcess({
                        api,
                        userKeys,
                        keyGenConfig: KEYGEN_CONFIGS.PQC,
                        addresses,
                        address,
                        addressKeys,
                        keyPassword: authentication.getPassword(),
                        keyTransparencyVerify,
                    });
                    await Promise.all([
                        resignSKLWithPrimaryKey({
                            api,
                            ktActivation: dispatch(getKTActivation()),
                            address,
                            newPrimaryKeys: getPrimaryAddressKeysForSigning(updatedActiveKeys, true),
                            formerPrimaryKeys: getPrimaryAddressKeysForSigning(formerActiveKeys, true),
                            userKeys,
                        }),
                        keyTransparencyCommit(user, userKeys),
                    ]);
                    createNotification({
                        text: c('PQC address key generation')
                            .t`Post-quantum address key successfully generated for ${addressEmail}.`,
                    });
                })
            );

            await dispatch(addressesThunk({ cache: CacheType.None })); // Ensures address keys is up to date.

            // TODO use n-step modal for progress instead of notifications
            // with address key generation in last step, so that the "resumption button" can open the same one
        } catch (error) {
            console.error(error);
            createNotification({
                text: c('PQC address key generation')
                    .t`Generating post-quantum address keys failed for one or more addresses.`,
                type: 'error',
            });
        }
    };

    const handleProcess = async () => {
        try {
            setLoading(true);
            await handleOptIn();
            await handleGenerateUserKey();
            await handleGenerateAddressKeyForAllAddresses();
        } finally {
            setLoading(false);
            rest.onClose?.();
        }
    };

    return (
        <ModalTwo size="medium" {...rest}>
            <ModalTwoHeader title={c('PQC optin').t`Enable post-quantum protection`} />
            <ModalTwoContent>
                <div>
                    {(() => {
                        const hasOutgoingE2EEForwardingsAcrossAddresses = outgoingAddressForwardings.some(
                            ({ Type, State }) =>
                                Type === ForwardingType.InternalEncrypted &&
                                // these states are already inactive and require re-confirmation by the forwardee, so we ignore them
                                State !== ForwardingState.Outdated &&
                                State !== ForwardingState.Rejected
                        );
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
                                        <p className="text-sm color-weak flex-1 pl-4 my-0">
                                            {getPausedForwardingNotice()}
                                        </p>
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
                    disabled={loadingDependencies}
                    data-testid="confirm-pqc-opt-in"
                    onClick={() => {
                        handleProcess().catch(noop);
                    }}
                >
                    {c('PQC optin').t`Enable post-Quantum protection`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default PostQuantumOptInModal;
