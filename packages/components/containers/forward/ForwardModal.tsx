import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { CryptoProxy, PrivateKeyReference, PublicKeyReference } from '@proton/crypto/lib';
import useLoading from '@proton/hooks/useLoading';
import { SetupForwardingParameters, setupForwarding, updateForwardingFilter } from '@proton/shared/lib/api/forwardings';
import { ADDRESS_RECEIVE, ENCRYPTION_CONFIGS, ENCRYPTION_TYPES, RECIPIENT_TYPES } from '@proton/shared/lib/constants';
import { emailValidator, requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { Address, DecryptedKey, ForwardingType, OutgoingAddressForwarding } from '@proton/shared/lib/interfaces';
import { addAddressKeysProcess, splitKeys } from '@proton/shared/lib/keys';
import illustration from '@proton/styles/assets/img/illustrations/forward-email-verification.svg';

import { useKTVerifier } from '..';
import {
    Form,
    Icon,
    InputFieldTwo,
    ModalProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    Option,
    SelectTwo,
    useFormErrors,
} from '../../components';
import {
    useAddressFlags,
    useAddresses,
    useApi,
    useAuthentication,
    useEventManager,
    useGetAddressKeys,
    useGetPublicKeys,
    useGetUser,
    useGetUserKeys,
    useNotifications,
} from '../../hooks';
import { Condition, FilterStatement } from '../filters/interfaces';
import ForwardConditions from './ForwardConditions';
import { getInternalParameters, getSieveParameters, getSieveTree } from './helpers';

interface Props extends ModalProps {
    forward?: OutgoingAddressForwarding;
}

enum Step {
    Setup,
    Verification,
}

interface Model {
    step: Step;
    loading?: boolean;
    edit?: boolean;
    addressID: string;
    email: string;
    isExternal?: boolean;
    isInternal?: boolean;
    forwardeePublicKey?: PublicKeyReference;
    forwarderKey?: PrivateKeyReference;
    forwarderAddressKeys?: DecryptedKey[];
    keySupportE2EEForwarding?: boolean;
    keyErrors?: string[];
    statement: FilterStatement;
    conditions: Condition[];
}

const getTitle = (model: Model) => {
    const { step } = model;

    if (step === Step.Setup) {
        return c('email_forwarding_2023: Title').t`Set up forwarding`;
    }

    if (step === Step.Verification) {
        return c('email_forwarding_2023: Title').t`Request confirmation`;
    }

    return '';
};

const encryptionConfig = ENCRYPTION_CONFIGS[ENCRYPTION_TYPES.CURVE25519];

const ForwardModal = ({ forward, onClose, ...rest }: Props) => {
    const isEditing = !!forward;
    const [addresses = []] = useAddresses();
    const api = useApi();
    const getUser = useGetUser();
    const silentApi = <T,>(config: any) => api<T>({ ...config, silence: true });
    const { keyTransparencyVerify, keyTransparencyCommit } = useKTVerifier(silentApi, getUser);
    const authentication = useAuthentication();
    const getPublicKeys = useGetPublicKeys();
    const getUserKeys = useGetUserKeys();
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const { validator, onFormSubmit } = useFormErrors();
    const [loading, withLoading] = useLoading();
    const filteredAddresses = addresses.filter(({ Receive }) => Receive === ADDRESS_RECEIVE.RECEIVE_YES);
    const [model, setModel] = useState<Model>(() => {
        const { statement, conditions } = isEditing
            ? getSieveParameters(forward.Filter?.Tree || [])
            : { statement: FilterStatement.ALL, conditions: [] };

        return {
            step: Step.Setup,
            addressID: isEditing ? forward.ForwarderAddressID : filteredAddresses[0].ID,
            email: isEditing ? forward.ForwardeeEmail : '',
            statement,
            conditions,
        };
    });
    const inputsDisabled = model.loading || isEditing;
    const forwarderAddress = addresses.find(({ ID }) => ID === model.addressID);
    const forwarderEmail = forwarderAddress?.Email || '';
    const forwardeeEmail = model.email;
    const getAddressKeys = useGetAddressKeys();
    const addressFlags = useAddressFlags(forwarderAddress as Address);
    const boldForwardeeEmail = <strong key="forwardee-email">{forwardeeEmail}</strong>;
    const boldForwarderEmail = <strong key="forwarder-email">{forwarderEmail}</strong>;

    const generateNewKey = async () => {
        if (!forwarderAddress) {
            throw new Error('No address');
        }

        if (!model.forwarderAddressKeys) {
            throw new Error('No forwarder address keys');
        }

        const userKeys = await getUserKeys();
        const [newKey] = await addAddressKeysProcess({
            api,
            userKeys,
            encryptionConfig,
            addresses,
            address: forwarderAddress,
            addressKeys: model.forwarderAddressKeys,
            keyPassword: authentication.getPassword(),
            keyTransparencyVerify,
        });
        const { privateKey: forwarderKey } = newKey;
        const [forwarderAddressKeys] = await Promise.all([
            getAddressKeys(model.addressID),
            keyTransparencyCommit(userKeys),
        ]);

        return {
            forwarderKey,
            forwarderAddressKeys,
        };
    };

    const handleSubmit = async () => {
        if (loading || !onFormSubmit()) {
            return;
        }

        if (model.step === Step.Setup) {
            if (isEditing) {
                await api(
                    updateForwardingFilter(
                        forward.ID,
                        getSieveTree({ conditions: model.conditions, statement: model.statement, email: model.email }),
                        forward.Filter?.Version || 2
                    )
                );
                await call();
                onClose?.();
                createNotification({ text: c('email_forwarding_2023: Success').t`Changes saved` });
                return;
            }
            const [forwarderAddressKeys, { RecipientType, publicKeys, Errors }] = await Promise.all([
                getAddressKeys(model.addressID),
                getPublicKeys({ email: model.email }),
            ]);
            const { privateKeys } = splitKeys(forwarderAddressKeys);
            const [forwarderKey] = privateKeys;
            const [forwardeePublicKeyArmored] = publicKeys || [];
            const [forwardeePublicKey, keySupportE2EEForwarding] = await Promise.all([
                forwardeePublicKeyArmored &&
                    CryptoProxy.importPublicKey({
                        armoredKey: forwardeePublicKeyArmored.armoredKey,
                    }),
                CryptoProxy.doesKeySupportE2EEForwarding({ forwarderKey }),
            ]);

            setModel({
                ...model,
                forwarderAddressKeys,
                keySupportE2EEForwarding,
                keyErrors: Errors,
                forwarderKey,
                forwardeePublicKey,
                isExternal: RecipientType === RECIPIENT_TYPES.TYPE_EXTERNAL,
                isInternal: RecipientType === RECIPIENT_TYPES.TYPE_INTERNAL,
                step: Step.Verification,
            });
            return;
        }

        if (model.step === Step.Verification) {
            // Disable encryption if the email is external
            if (model.isExternal && addressFlags?.encryptionDisabled === false) {
                await addressFlags?.handleSetAddressFlags(true, addressFlags?.expectSignatureDisabled);
            }

            const params: SetupForwardingParameters = {
                ForwarderAddressID: model.addressID,
                ForwardeeEmail: model.email,
                Type: model.isInternal ? ForwardingType.InternalEncrypted : ForwardingType.ExternalUnencrypted,
                Tree: getSieveTree({ conditions: model.conditions, statement: model.statement, email: model.email }),
                Version: forward?.Filter?.Version || 2,
            };
            let requireNewKey = false;
            if (model.isInternal && forwarderAddress?.Keys && model.forwardeePublicKey && model.forwarderKey) {
                let forwarderKey = model.forwarderKey;

                if (!model.keySupportE2EEForwarding) {
                    // The forwarding material generation will fail if the address key is e.g. RSA instead of ECC 25519
                    // So we generate automatically a new ECC 25519 key for the address
                    const newProperties = await generateNewKey();
                    // Save the new key in case something goes wrong later
                    setModel({
                        ...model,
                        ...newProperties,
                    });
                    forwarderKey = newProperties.forwarderKey;
                }

                const { activationToken, forwardeeKey, proxyInstances } = await getInternalParameters(
                    forwarderKey,
                    [{ email: model.email, name: model.email }],
                    model.forwardeePublicKey
                );
                params.ForwardeePrivateKey = forwardeeKey;
                params.ActivationToken = activationToken;
                params.ProxyInstances = proxyInstances;
            }

            await api(setupForwarding(params));
            await call();
            onClose?.();
            createNotification({ text: c('email_forwarding_2023: Success').t`Email sent to ${forwardeeEmail}.` });

            if (requireNewKey) {
                createNotification({
                    text: c('email_forwarding_2023: Success')
                        .t`A new encryption key has been generated for ${forwarderEmail}.`,
                });
            }
            return;
        }
    };

    const handleBack = () => {
        setModel({ ...model, step: Step.Setup });
    };

    return (
        <ModalTwo
            as={Form}
            onClose={onClose}
            onSubmit={() => withLoading(handleSubmit())}
            onReset={() => {
                onClose?.();
            }}
            {...rest}
        >
            <ModalTwoHeader title={getTitle(model)} />
            <ModalTwoContent>
                {model.step === Step.Setup && (
                    <>
                        <InputFieldTwo
                            id="from-select"
                            as={SelectTwo}
                            label={c('email_forwarding_2023: Label').t`Forward from`}
                            value={model.addressID}
                            onValue={(value: unknown) => setModel({ ...model, addressID: value as string })}
                            disabled={inputsDisabled}
                            disabledOnlyField={inputsDisabled}
                            autoFocus
                        >
                            {filteredAddresses.map(({ ID, Email }) => (
                                <Option title={Email} key={ID} value={ID}>
                                    {Email}
                                </Option>
                            ))}
                        </InputFieldTwo>
                        <InputFieldTwo
                            id="to-input"
                            label={c('email_forwarding_2023: Label').t`Forward to`}
                            placeholder={c('email_forwarding_2023: Placeholder').t`Enter email address`}
                            disabled={inputsDisabled}
                            disabledOnlyField={inputsDisabled}
                            readOnly={isEditing}
                            type="email"
                            error={validator([requiredValidator(model.email), emailValidator(model.email)])}
                            value={model.email}
                            onValue={(value: string) => setModel({ ...model, email: value })}
                            required
                        />
                        <hr />
                        <ForwardConditions
                            conditions={model.conditions}
                            statement={model.statement}
                            validator={validator}
                            onChangeStatement={(newStatement) => setModel({ ...model, statement: newStatement })}
                            onChangeConditions={(newConditions) => setModel({ ...model, conditions: newConditions })}
                        />
                    </>
                )}
                {model.step === Step.Verification && (
                    <>
                        <div className="text-center">
                            <img src={illustration} alt="" />
                            <p>{c('email_forwarding_2023: Info')
                                .jt`A confirmation email will be sent to ${boldForwardeeEmail}`}</p>
                            <p>{c('email_forwarding_2023: Info')
                                .t`Forwarding to this address will become active once the recipient accepts the forwarding.`}</p>
                        </div>
                        {model.isExternal ? (
                            <div className="border rounded-lg p-4 flex flex-nowrap flex-align-items-center mb-3">
                                <Icon name="exclamation-circle" className="flex-item-noshrink color-danger" />
                                <p className="text-sm color-weak flex-item-fluid pl-4 my-0">
                                    {c('email_forwarding_2023: Info')
                                        .jt`Forwarding to an address without end-to-end encryption requires disabling end-to-end encryption for your ${boldForwarderEmail} email address. `}
                                </p>
                            </div>
                        ) : null}
                        {model.isExternal || model.keySupportE2EEForwarding ? null : (
                            <div className="border rounded-lg p-4 flex flex-nowrap flex-align-items-center mb-3">
                                <Icon name="exclamation-circle" className="flex-item-noshrink color-danger" />
                                <p className="text-sm color-weak flex-item-fluid pl-4 my-0">
                                    {c('email_forwarding_2023: Info')
                                        .jt`A new encryption key will be generated for ${boldForwarderEmail}.`}
                                </p>
                            </div>
                        )}
                        {model?.keyErrors?.length ? (
                            <div className="border rounded-lg p-4 flex flex-nowrap flex-align-items-center">
                                <Icon name="exclamation-circle" className="flex-item-noshrink color-danger" />
                                <p className="text-sm color-weak flex-item-fluid pl-4 my-0">
                                    {model.keyErrors.join(' ')}
                                </p>
                            </div>
                        ) : null}
                    </>
                )}
            </ModalTwoContent>
            <ModalTwoFooter>
                {model.step === Step.Setup && (
                    <>
                        <Button disabled={loading} type="reset">{c('email_forwarding_2023: Action').t`Cancel`}</Button>
                        <Button loading={loading} color="norm" type="submit">
                            {isEditing
                                ? c('email_forwarding_2023: Action').t`Save`
                                : c('email_forwarding_2023: Action').t`Next`}
                        </Button>
                    </>
                )}
                {model.step === Step.Verification && (
                    <>
                        <Button onClick={handleBack}>{c('email_forwarding_2023: Action').t`Back`}</Button>
                        <Button loading={loading} color="norm" type="submit">{c('email_forwarding_2023: Action')
                            .t`Send confirmation email`}</Button>
                    </>
                )}
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default ForwardModal;
