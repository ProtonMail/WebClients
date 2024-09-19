import { useMemo, useState } from 'react';

import { c } from 'ttag';

import { Button, Href } from '@proton/atoms';
import Form from '@proton/components/components/form/Form';
import Icon from '@proton/components/components/icon/Icon';
import useKTVerifier from '@proton/components/containers/keyTransparency/useKTVerifier';
import type { PrivateKeyReference, PublicKeyReference } from '@proton/crypto/lib';
import { CryptoProxy } from '@proton/crypto/lib';
import useLoading from '@proton/hooks/useLoading';
import type { SetupForwardingParameters } from '@proton/shared/lib/api/forwardings';
import { setupForwarding, updateForwardingFilter } from '@proton/shared/lib/api/forwardings';
import { ADDRESS_RECEIVE, KEYGEN_CONFIGS, KEYGEN_TYPES, RECIPIENT_TYPES } from '@proton/shared/lib/constants';
import { emailValidator, requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { Address, DecryptedKey, OutgoingAddressForwarding } from '@proton/shared/lib/interfaces';
import { ForwardingType } from '@proton/shared/lib/interfaces';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import { addAddressKeysProcess, getEmailFromKey, splitKeys } from '@proton/shared/lib/keys';
import illustration from '@proton/styles/assets/img/illustrations/forward-email-verification.svg';
import uniqueBy from '@proton/utils/uniqueBy';

import type { ModalProps } from '../../components';
import {
    InputFieldTwo,
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
    useContactEmails,
    useEventManager,
    useGetAddressKeys,
    useGetPublicKeysForInbox,
    useGetUser,
    useGetUserKeys,
    useNotifications,
} from '../../hooks';
import type { Condition } from '../filters/interfaces';
import { FilterStatement } from '../filters/interfaces';
import ForwardConditions from './ForwardConditions';
import { getInternalParametersPrivate, getSieveParameters, getSieveTree } from './helpers';

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
    isExternal?: boolean;
    isInternal?: boolean;
    forwardeeEmail: string;
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

const getDefaultModel = ({ forward, addresses }: { addresses: Address[]; forward?: OutgoingAddressForwarding }) => {
    const isEditing = !!forward;
    const { statement, conditions } = isEditing
        ? getSieveParameters(forward.Filter?.Tree || [])
        : { statement: FilterStatement.ALL, conditions: [] };

    const [firstAddress] = addresses;
    return {
        step: Step.Setup,
        addressID: isEditing ? forward.ForwarderAddressID : firstAddress?.ID || '',
        forwardeeEmail: isEditing ? forward.ForwardeeEmail : '',
        statement,
        conditions,
    };
};

const compareContactEmailByEmail = (a: ContactEmail, b: ContactEmail) => {
    return a.Email.localeCompare(b.Email);
};

const keyGenConfig = KEYGEN_CONFIGS[KEYGEN_TYPES.CURVE25519];

const ForwardModal = ({ forward, onClose, ...rest }: Props) => {
    const isEditing = !!forward;
    const [addresses = []] = useAddresses();
    const [contactEmails = []] = useContactEmails();
    const contactEmailsSorted = useMemo(() => {
        const uniqueEmails = uniqueBy(contactEmails, ({ Email }) => Email.toLowerCase());
        const sortedEmails = [...uniqueEmails].sort(compareContactEmailByEmail);
        return sortedEmails;
    }, [contactEmails]);
    const api = useApi();
    const getUser = useGetUser();
    const silentApi = <T,>(config: any) => api<T>({ ...config, silence: true });
    const { keyTransparencyVerify, keyTransparencyCommit } = useKTVerifier(silentApi, getUser);
    const authentication = useAuthentication();
    const getPublicKeysForInbox = useGetPublicKeysForInbox();
    const getAddressKeys = useGetAddressKeys();
    const getUserKeys = useGetUserKeys();
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const { validator, onFormSubmit } = useFormErrors();
    const [loading, withLoading] = useLoading();
    const filteredAddresses = addresses.filter(({ Receive }) => Receive === ADDRESS_RECEIVE.RECEIVE_YES);
    const [model, setModel] = useState<Model>(getDefaultModel({ forward, addresses: filteredAddresses }));
    const inputsDisabled = model.loading || isEditing;
    const forwarderAddress = addresses.find(({ ID }) => ID === model.addressID);
    const forwarderEmail = forwarderAddress?.Email || '';
    const addressFlags = useAddressFlags(forwarderAddress);
    const boldForwardeeEmail = <strong key="forwardee-email">{model.forwardeeEmail}</strong>;
    const boldForwarderEmail = <strong key="forwarder-email">{forwarderEmail}</strong>;
    const learnMoreLink = (
        <Href href={getKnowledgeBaseUrl('/email-forwarding')}>{c('email_forwarding_2023: Link').t`Learn more`}</Href>
    );

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
            keyGenConfig,
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

    const handleEdit = async () => {
        if (isEditing) {
            await api(
                updateForwardingFilter(
                    forward.ID,
                    getSieveTree({
                        conditions: model.conditions,
                        statement: model.statement,
                        email: model.forwardeeEmail,
                    }),
                    forward.Filter?.Version || 2
                )
            );
            await call();
            onClose?.();
            createNotification({ text: c('email_forwarding_2023: Success').t`Changes saved` });
        }
    };

    const handleSetup = async () => {
        const [forwarderAddressKeys, forwardeeKeysConfig] = await Promise.all([
            getAddressKeys(model.addressID),
            getPublicKeysForInbox({ email: model.forwardeeEmail, lifetime: 0 }),
        ]);

        // Abort the setup if e.g. the given address is internal but does not exist
        const apiErrors = forwardeeKeysConfig.Errors || [];
        if (apiErrors.length > 0) {
            apiErrors.forEach((error: string) => {
                createNotification({ text: error, type: 'error' });
            });
            return;
        }

        const isInternal = forwardeeKeysConfig.RecipientType === RECIPIENT_TYPES.TYPE_INTERNAL;
        const isExternal = forwardeeKeysConfig.RecipientType === RECIPIENT_TYPES.TYPE_EXTERNAL;
        const { privateKeys } = splitKeys(forwarderAddressKeys);
        const [forwarderKey] = privateKeys;
        const keySupportE2EEForwarding = await CryptoProxy.doesKeySupportE2EEForwarding({ forwarderKey });
        let forwardeePublicKey: PublicKeyReference | undefined;
        let forwardeeEmailFromPublicKey: string | undefined;

        if (isInternal) {
            // While forwarding could be setup with generic catch-all addresses, we disallow this as the catch-all address case is triggered
            // if the forwardee is a private subuser who has yet to login (i.e.has missing keys).
            // In such case, the admin public keys are temporarily returned instead, meaning that E2EE forwarding will be (permanently) setup with the admin, rather
            // than the subuser, which is undesirable.
            if (forwardeeKeysConfig.isCatchAll) {
                createNotification({ text: 'This address cannot be used as forwarding recipient', type: 'error' });
                return;
            }
            const [primaryForwardeeKey] = forwardeeKeysConfig.publicKeys;
            forwardeePublicKey = await CryptoProxy.importPublicKey({
                armoredKey: primaryForwardeeKey.armoredKey,
            });
            forwardeeEmailFromPublicKey = getEmailFromKey(forwardeePublicKey);
        }

        setModel({
            ...model,
            forwarderAddressKeys,
            keySupportE2EEForwarding,
            keyErrors: forwardeeKeysConfig.Errors,
            forwarderKey,
            forwardeePublicKey,
            forwardeeEmail: forwardeeEmailFromPublicKey || model.forwardeeEmail,
            isExternal,
            isInternal,
            step: Step.Verification,
        });
    };

    const handleVerification = async () => {
        // Disable encryption if the email is external
        if (model.isExternal && addressFlags?.encryptionDisabled === false) {
            await addressFlags?.handleSetAddressFlags(true, addressFlags?.expectSignatureDisabled);
        }

        const params: SetupForwardingParameters = {
            ForwarderAddressID: model.addressID,
            ForwardeeEmail: model.forwardeeEmail,
            Type: model.isInternal ? ForwardingType.InternalEncrypted : ForwardingType.ExternalUnencrypted,
            Tree: getSieveTree({
                conditions: model.conditions,
                statement: model.statement,
                email: model.forwardeeEmail,
            }),
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

            const { activationToken, forwardeeKey, proxyInstances } = await getInternalParametersPrivate(
                forwarderKey,
                [{ email: model.forwardeeEmail, name: model.forwardeeEmail }],
                model.forwardeePublicKey
            );
            params.ForwardeePrivateKey = forwardeeKey;
            params.ActivationToken = activationToken;
            params.ProxyInstances = proxyInstances;
        }

        await api(setupForwarding(params));
        await call();
        onClose?.();
        createNotification({ text: c('email_forwarding_2023: Success').t`Email sent to ${model.forwardeeEmail}.` });

        if (requireNewKey) {
            createNotification({
                text: c('email_forwarding_2023: Success')
                    .t`A new encryption key has been generated for ${forwarderEmail}.`,
            });
        }
    };

    const handleSubmit = async () => {
        if (loading || !onFormSubmit()) {
            return;
        }

        if (isEditing) {
            return handleEdit();
        }

        if (model.step === Step.Setup) {
            return handleSetup();
        }

        if (model.step === Step.Verification) {
            return handleVerification();
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
                            {(isEditing ? addresses : filteredAddresses).map(({ ID, Email, Receive }) => (
                                <Option
                                    title={Email}
                                    key={ID}
                                    value={ID}
                                    disabled={Receive !== ADDRESS_RECEIVE.RECEIVE_YES}
                                >
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
                            list="contact-emails"
                            type="email"
                            error={validator([
                                requiredValidator(model.forwardeeEmail),
                                emailValidator(model.forwardeeEmail),
                            ])}
                            value={model.forwardeeEmail}
                            onValue={(value: string) => setModel({ ...model, forwardeeEmail: value })}
                            required
                        />
                        {contactEmailsSorted.length ? (
                            <datalist id="contact-emails">
                                {contactEmailsSorted?.map((contactEmail) => (
                                    <option key={contactEmail.ID} value={contactEmail.Email}>
                                        {contactEmail.Email}
                                    </option>
                                ))}
                            </datalist>
                        ) : null}
                        <hr className="my-4" />
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
                            <div className="border rounded-lg p-4 flex flex-nowrap items-center mb-3">
                                <Icon name="exclamation-circle" className="shrink-0 color-danger" />
                                <p className="text-sm color-weak flex-1 pl-4 my-0">
                                    {c('email_forwarding_2023: Info')
                                        .jt`Forwarding to an address without end-to-end encryption will disable end-to-end encryption for your ${boldForwarderEmail} address, but zero-access encryption remains enabled. ${learnMoreLink}`}
                                </p>
                            </div>
                        ) : null}
                        {model.isExternal || model.keySupportE2EEForwarding ? null : (
                            <div className="border rounded-lg p-4 flex flex-nowrap items-center mb-3">
                                <Icon name="exclamation-circle" className="shrink-0 color-danger" />
                                <p className="text-sm color-weak flex-1 pl-4 my-0">
                                    {c('email_forwarding_2023: Info')
                                        .jt`A new encryption key will be generated for ${boldForwarderEmail}.`}
                                </p>
                            </div>
                        )}
                        {model?.keyErrors?.length ? (
                            <div className="border rounded-lg p-4 flex flex-nowrap items-center">
                                <Icon name="exclamation-circle" className="shrink-0 color-danger" />
                                <p className="text-sm color-weak flex-1 pl-4 my-0">{model.keyErrors.join(' ')}</p>
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
