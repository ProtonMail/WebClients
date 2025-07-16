import type { ReactNode } from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

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
import Checkbox from '@proton/components/components/input/Checkbox';
import Label from '@proton/components/components/label/Label';
import LoadingTextStepper from '@proton/components/components/loader/LoadingTextStepper';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import useApi from '@proton/components/hooks/useApi';
import useAuthentication from '@proton/components/hooks/useAuthentication';
import { useIsDeviceRecoveryAvailable, useIsDeviceRecoveryEnabled } from '@proton/components/hooks/useDeviceRecovery';
import useLoading from '@proton/hooks/useLoading';
import { resignSKLWithPrimaryKey } from '@proton/key-transparency/lib';
import { useOutgoingAddressForwardings } from '@proton/mail/store/forwarding/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { CacheType } from '@proton/redux-utilities';
import { updateFlags } from '@proton/shared/lib/api/settings';
import { BRAND_NAME, KEYGEN_CONFIGS } from '@proton/shared/lib/constants';
import { ForwardingState, ForwardingType } from '@proton/shared/lib/interfaces';
import { addAddressKeysProcess, addUserKeysProcess, getPrimaryAddressKeysForSigning } from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';

import { getMailRouteTitles } from '../../account/constants/settingsRouteTitles';
import useKTVerifier from '../../keyTransparency/useKTVerifier';
import getPausedForwardingNotice from '../changePrimaryKeyForwardingNotice/getPausedForwardingNotice';

interface Props extends ModalProps {}

enum Step {
    CONFIRMATION,
    IN_PROGRESS_OPTIN,
    IN_PROGRESS_ACCOUNT_KEY,
    IN_PROGRESS_ADDRESS_KEYS,
    SUCCESS,
    ERROR,
}
interface Model {
    step: Step;
    error?: ReactNode;
}

const PostQuantumOptInModal = ({ ...rest }: Props) => {
    const api = useApi();
    const createKTVerifier = useKTVerifier();
    const dispatch = useDispatch();
    const [outgoingAddressForwardings = [], loadingOutgoingAddressForwardings] = useOutgoingAddressForwardings();
    const authentication = useAuthentication();
    const [isDeviceRecoveryAvailable, loadingDeviceRecovery] = useIsDeviceRecoveryAvailable();
    const isDeviceRecoveryEnabled = useIsDeviceRecoveryEnabled();

    const loadingDependencies = loadingOutgoingAddressForwardings || loadingDeviceRecovery;
    const [loading, withLoading] = useLoading();
    const [model, setModel] = useState<Model>({ step: Step.CONFIRMATION });
    const [understoodForceUpgrade, setUnderstoodForceUpgrade] = useState(false);

    const handleGenerateAddressKeyForAllAddresses = async () => {
        const [user, userKeys, addresses] = await Promise.all([
            dispatch(userThunk()),
            dispatch(userKeysThunk()),
            dispatch(addressesThunk()),
        ]);
        try {
            await Promise.all(
                addresses.map(async (address) => {
                    const { ID: addressID } = address;
                    const addressKeys = await dispatch(addressKeysThunk({ addressID }));
                    // v6 key already present, skip (TODO: check PQC algo)
                    if (addressKeys.some((key) => key.privateKey.isPrivateKeyV6())) {
                        return;
                    }
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
                })
            );

            await dispatch(addressesThunk({ cache: CacheType.None })); // Ensures address keys is up to date.
            setModel({ step: Step.SUCCESS });
        } catch (error) {
            console.error(error);
            const encryptionAndKeysSettingsTitle = getMailRouteTitles().keys;
            setModel({
                step: Step.ERROR,
                error: c('PQC adress key generation')
                    .t`Post-quantum protection has been enabled on your account, but some operations were not successful: generating post-quantum address keys for one or more addresses failed. You can manually generate these keys under the ${encryptionAndKeysSettingsTitle} settings.`,
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
            setModel({ step: Step.IN_PROGRESS_ADDRESS_KEYS });
            return await handleGenerateAddressKeyForAllAddresses();
        } catch (error) {
            console.error(error);
            const encryptionAndKeysSettingsTitle = getMailRouteTitles().keys;
            setModel({
                step: Step.ERROR,
                error: c('PQC account key generation')
                    .t`Post-quantum protection has been enabled on your account, but some operations were not successful: generating post-quantum account and address keys failed. You can manually generate these keys under the ${encryptionAndKeysSettingsTitle} settings.`,
            });
        }
    };

    const handleOptIn = async () => {
        try {
            const updatedFlagSupportPgpV6Keys = { SupportPgpV6Keys: 1 } as const;
            await api(updateFlags(updatedFlagSupportPgpV6Keys));
            // optimistically update user settings without waiting for event loop;
            // this is done only after awaiting the API response since it will fail if the action is not authorized.
            dispatch(userSettingsActions.update({ UserSettings: { Flags: updatedFlagSupportPgpV6Keys } }));
            setModel({
                step: Step.IN_PROGRESS_ACCOUNT_KEY,
            });
            return await handleGenerateUserKey();
        } catch (error) {
            console.error(error);
            setModel({
                step: Step.ERROR,
                error: c('PQC optin').t`Enabling post-quantum protection failed. Try again later.`,
            });
        }
    };

    const handleSubmit = async () => {
        if (model.step === Step.CONFIRMATION) {
            setModel({ step: Step.IN_PROGRESS_OPTIN });
            return handleOptIn();
        }
    };

    const hasOutgoingE2EEForwardingsAcrossAddresses = outgoingAddressForwardings.some(
        ({ Type, State }) =>
            Type === ForwardingType.InternalEncrypted &&
            // these states are already inactive and require re-confirmation by the forwardee, so we ignore them
            State !== ForwardingState.Outdated &&
            State !== ForwardingState.Rejected
    );

    const isProgressStep =
        model.step === Step.IN_PROGRESS_OPTIN ||
        model.step === Step.IN_PROGRESS_ADDRESS_KEYS ||
        model.step === Step.IN_PROGRESS_ACCOUNT_KEY;

    const forceUpgradeSeeHowLink = (
        <Link key="see-how" to={'todo'}>
            {c('Force upgrade safety review').t`See how`}
        </Link>
    );

    return (
        <ModalTwo size="medium" {...rest}>
            <ModalTwoHeader
                title={
                    model.step === Step.CONFIRMATION
                        ? c('PQC optin').t`Enable post-quantum protection?`
                        : c('PQC optin').t`Enable post-quantum protection`
                }
            />
            <ModalTwoContent>
                <div>
                    {model.step === Step.CONFIRMATION && (
                        <>
                            <div className="mb-2">
                                {c('PQC key generation')
                                    .t`This will generate a new account key and a new email encryption key for each address; these will be used to encrypt and decrypt future emails and other data.`}
                            </div>
                            {hasOutgoingE2EEForwardingsAcrossAddresses && (
                                <div className="border border-weak rounded-lg p-4 flex flex-nowrap items-center mb-3 mt-4">
                                    <Icon name="exclamation-circle-filled" className="shrink-0 color-warning" />
                                    <p className="text-sm color-weak flex-1 pl-4 my-0">{getPausedForwardingNotice()}</p>
                                </div>
                            )}
                            <div
                                className="border rounded-lg p-4 flex flex-nowrap items-center mb-3 mt-4"
                                style={{
                                    backgroundColor: 'var(--signal-danger-minor-2)',
                                    borderColor: 'var(--signal-danger-minor-2)',
                                }}
                            >
                                <Icon name="exclamation-circle-filled" className="shrink-0 color-danger" />
                                <p className="text-sm color-weak flex-1 pl-4 my-0">
                                    {getBoldFormattedText(
                                        c('PQC compatibility warning')
                                            .t`Please update **all your ${BRAND_NAME} mobile apps** to the latest version.`
                                    )}{' '}
                                    {forceUpgradeSeeHowLink}
                                </p>
                            </div>
                            <div className="flex flex-row items-start">
                                <Checkbox
                                    id="understood-pqc-force-upgrade"
                                    className="mt-2 mr-2"
                                    checked={understoodForceUpgrade}
                                    onChange={() => setUnderstoodForceUpgrade(!understoodForceUpgrade)}
                                />
                                <Label htmlFor="understood-recovery-necessity" className="flex-1">
                                    {c('Force upgrade safety review')
                                        .t`I understand that I will no longer be able to sign in from older versions of ${BRAND_NAME} mobile apps.`}
                                </Label>
                            </div>
                        </>
                    )}
                    {isProgressStep && (
                        <>
                            <div className="text-center" role="alert">
                                <div className="inline-block">
                                    <LoadingTextStepper
                                        steps={[
                                            c('pqc-optin: Progress status').t`Opting into post-quantum protection`,
                                            c('pqc-optin: Progress status').t`Generating post-quantum account key`,
                                            c('pqc-optin: Progress status')
                                                .t`Generating post-quantum address keys for each address`,
                                        ]}
                                        stepIndex={[
                                            Step.IN_PROGRESS_OPTIN,
                                            Step.IN_PROGRESS_ACCOUNT_KEY,
                                            Step.IN_PROGRESS_ADDRESS_KEYS,
                                        ].indexOf(model.step)}
                                        hideFutureSteps={false}
                                    />
                                </div>
                            </div>
                        </>
                    )}
                    {model.step === Step.SUCCESS && (
                        <>
                            <div className="text-center">
                                <p>
                                    {c('pqc-optin: Info').jt`Post-quantum protection has been enabled on your account!`}
                                </p>
                            </div>
                        </>
                    )}
                    {model.step === Step.ERROR && (
                        <>
                            <div className="text-center">
                                <p>{model.error}</p>
                            </div>
                        </>
                    )}
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                {(model.step === Step.CONFIRMATION || isProgressStep) && (
                    <>
                        <Button disabled={loading} onClick={rest.onClose}>{c('Action').t`Cancel`}</Button>
                        <Button
                            color="danger"
                            loading={loading}
                            disabled={loadingDependencies || !understoodForceUpgrade}
                            data-testid="confirm-pqc-opt-in"
                            onClick={() => withLoading(handleSubmit().catch(noop))}
                        >
                            {c('PQC optin').t`Enable and generate keys`}
                        </Button>
                    </>
                )}
                {(model.step === Step.SUCCESS || model.step === Step.ERROR) && (
                    <Button onClick={rest.onClose} fullWidth={true}>
                        {c('pqc-optin: Action').t`Got it`}
                    </Button>
                )}
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default PostQuantumOptInModal;
