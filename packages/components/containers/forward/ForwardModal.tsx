import { useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { useGetAddressKeys } from '@proton/account/addressKeys/hooks';
import { addressesThunk } from '@proton/account/addresses';
import { useAddresses, useGetAddresses } from '@proton/account/addresses/hooks';
import { useGetUser } from '@proton/account/user/hooks';
import { useGetUserKeys } from '@proton/account/userKeys/hooks';
import { Button, Href } from '@proton/atoms';
import Form from '@proton/components/components/form/Form';
import Icon from '@proton/components/components/icon/Icon';
import EllipsisLoader from '@proton/components/components/loader/EllipsisLoader';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import useKTVerifier from '@proton/components/containers/keyTransparency/useKTVerifier';
import useApi from '@proton/components/hooks/useApi';
import useAuthentication from '@proton/components/hooks/useAuthentication';
import useEventManager from '@proton/components/hooks/useEventManager';
import useGetPublicKeysForInbox from '@proton/components/hooks/useGetPublicKeysForInbox';
import useNotifications from '@proton/components/hooks/useNotifications';
import type { PrivateKeyReferenceV4, PublicKeyReference } from '@proton/crypto/lib';
import { CryptoProxy } from '@proton/crypto/lib';
import useLoading from '@proton/hooks/useLoading';
import { useContactEmails } from '@proton/mail/contactEmails/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { CacheType } from '@proton/redux-utilities';
import type { SetupForwardingParameters } from '@proton/shared/lib/api/forwardings';
import { setupForwarding, updateForwarding, updateForwardingFilter } from '@proton/shared/lib/api/forwardings';
import { ADDRESS_RECEIVE, RECIPIENT_TYPES } from '@proton/shared/lib/constants';
import { emailValidator, requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { Address, DecryptedAddressKey, OutgoingAddressForwarding } from '@proton/shared/lib/interfaces';
import { ForwardingState, ForwardingType } from '@proton/shared/lib/interfaces';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import {
    getActiveAddressKeys,
    getEmailFromKey,
    getPrimaryActiveAddressKeyForEncryption,
} from '@proton/shared/lib/keys';
import illustration from '@proton/styles/assets/img/illustrations/forward-email-verification.svg';
import uniqueBy from '@proton/utils/uniqueBy';

import useAddressFlags from '../../hooks/useAddressFlags';
import type { Condition } from '../filters/interfaces';
import { FilterStatement } from '../filters/interfaces';
import ForwardConditions from './ForwardConditions';
import { getInternalParametersPrivate, getSieveParameters, getSieveTree } from './helpers';
import { generateNewE2EEForwardingCompatibleAddressKey, handleUnsetV6PrimaryKey } from './keyHelpers';

interface Props extends ModalProps {
    existingForwardingConfig?: OutgoingAddressForwarding;
}

enum Step {
    Setup,
    UserConfirmation,
    FixupPrimaryKeyV6,
    FixupUnsupportedPrimaryKeyV4,
    FinalizeForwardingSetup,
}

interface Model {
    step: Step;
    loading?: boolean;
    addressID: string;
    isExternal?: boolean;
    isInternal?: boolean;
    forwardeeEmail: string;
    forwardeePublicKey?: PublicKeyReference;
    forwarderPrimaryKeysInfo?: {
        v4: { ID: string; supportsE2EEForwarding: boolean };
        v6?: { ID: string; supportsE2EEForwarding: false };
    };
    addresses: Address[];
    forwarderAddressKeys?: DecryptedAddressKey[];
    keyErrors?: string[];
    statement: FilterStatement;
    conditions: Condition[];
}

const getTitle = (model: Model) => {
    const { step } = model;

    if (step === Step.Setup) {
        return c('email_forwarding_2023: Title').t`Set up forwarding`;
    }

    if (
        step === Step.UserConfirmation ||
        model.step === Step.FixupPrimaryKeyV6 ||
        model.step === Step.FixupUnsupportedPrimaryKeyV4 ||
        model.step === Step.FinalizeForwardingSetup
    ) {
        return c('email_forwarding_2023: Title').t`Request confirmation`;
    }
    return '';
};

const getKeyFixupDetails = (
    forwarderPrimaryKeysInfo: Model['forwarderPrimaryKeysInfo'],
    boldForwarderEmail: React.JSX.Element
) => {
    if (!forwarderPrimaryKeysInfo) {
        return null;
    }

    if (forwarderPrimaryKeysInfo.v4.supportsE2EEForwarding) {
        return forwarderPrimaryKeysInfo?.v6
            ? c('email_forwarding_2023: Info').jt`Post-quantum encryption will be disabled for ${boldForwarderEmail}.`
            : null;
    } else {
        return forwarderPrimaryKeysInfo?.v6
            ? c('email_forwarding_2023: Info').jt`A new encryption key will be generated for ${boldForwarderEmail}.`
            : c('email_forwarding_2023: Info')
                  .jt`Post-quantum encryption will be disabled, and a new encryption key will be generated for ${boldForwarderEmail}.`;
    }
};

const getDefaultModel = ({
    existingForwardingConfig,
    addresses,
}: {
    addresses: Address[];
    existingForwardingConfig?: OutgoingAddressForwarding;
}): Model => {
    const { statement, conditions } = existingForwardingConfig
        ? getSieveParameters(existingForwardingConfig.Filter?.Tree || [])
        : { statement: FilterStatement.ALL, conditions: [] };

    const [primaryAddress] = addresses;
    if (!primaryAddress) {
        throw new Error('Missing primary address');
    }
    return {
        step: Step.Setup,
        addressID: existingForwardingConfig ? existingForwardingConfig.ForwarderAddressID : primaryAddress.ID,
        forwardeeEmail: existingForwardingConfig ? existingForwardingConfig.ForwardeeEmail : '',
        statement,
        conditions,
        addresses,
    };
};

const compareContactEmailByEmail = (a: ContactEmail, b: ContactEmail) => {
    return a.Email.localeCompare(b.Email);
};

const ForwardModal = ({ existingForwardingConfig, onClose, ...rest }: Props) => {
    const isEditingFilters =
        existingForwardingConfig?.State === ForwardingState.Active ||
        existingForwardingConfig?.State === ForwardingState.Pending;
    const isReEnablingForwarding = existingForwardingConfig?.State === ForwardingState.Outdated;
    const [initialAddresses = []] = useAddresses(); // these will have out-of-date info (e.g. SKLs) after primary key changes
    const getAddresses = useGetAddresses();
    const [contactEmails = []] = useContactEmails();
    const contactEmailsSorted = useMemo(() => {
        const uniqueEmails = uniqueBy(contactEmails, ({ Email }) => Email.toLowerCase());
        const sortedEmails = [...uniqueEmails].sort(compareContactEmailByEmail);
        return sortedEmails;
    }, [contactEmails]);
    const api = useApi();
    const getUser = useGetUser();
    const createKTVerifier = useKTVerifier();
    const authentication = useAuthentication();
    const getPublicKeysForInbox = useGetPublicKeysForInbox();
    const getAddressKeys = useGetAddressKeys();
    const getUserKeys = useGetUserKeys();
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const { validator, onFormSubmit } = useFormErrors();
    const [loading, withLoading] = useLoading();
    const filterAddresses = (addresses: Address[]) =>
        addresses.filter(({ Receive }) => Receive === ADDRESS_RECEIVE.RECEIVE_YES);
    const [model, setModel] = useState<Model>(
        getDefaultModel({ existingForwardingConfig, addresses: filterAddresses(initialAddresses) })
    );
    const getForwarderAddress = (addresses: Address[]) => {
        const address = addresses.find(({ ID }) => ID === model.addressID);
        if (!address) {
            throw new Error('Missing forwarder address');
        }
        return address;
    };
    const inputsDisabled = model.loading || isEditingFilters || isReEnablingForwarding;
    const initialForwarderAddress = getForwarderAddress(initialAddresses);
    const forwarderEmail = initialForwarderAddress?.Email || '';
    const addressFlags = useAddressFlags(initialForwarderAddress);
    const dispatch = useDispatch();
    const boldForwardeeEmail = <strong key="forwardee-email">{model.forwardeeEmail}</strong>;
    const boldForwarderEmail = <strong key="forwarder-email">{forwarderEmail}</strong>;
    const learnMoreLink = (
        <Href href={getKnowledgeBaseUrl('/email-forwarding')}>{c('email_forwarding_2023: Link').t`Learn more`}</Href>
    );

    const handleEdit = async () => {
        if (isEditingFilters) {
            await api(
                updateForwardingFilter(
                    existingForwardingConfig.ID,
                    getSieveTree({
                        conditions: model.conditions,
                        statement: model.statement,
                        email: model.forwardeeEmail,
                    }),
                    existingForwardingConfig.Filter?.Version || 2
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

        const addresses = await getAddresses();
        const forwarderAddress = getForwarderAddress(addresses);
        const activeKeysByVersion = await getActiveAddressKeys(forwarderAddress.SignedKeyList, forwarderAddressKeys);
        const maybeV6ForwarderEncryptionKey = getPrimaryActiveAddressKeyForEncryption(activeKeysByVersion, true);
        const v4ForwarderEncryptionKey = getPrimaryActiveAddressKeyForEncryption(activeKeysByVersion, false);

        const forwarderPrimaryKeysInfo = {
            v4: {
                ID: v4ForwarderEncryptionKey.ID,
                supportsE2EEForwarding: await CryptoProxy.doesKeySupportE2EEForwarding({
                    forwarderKey: v4ForwarderEncryptionKey.privateKey,
                }),
            },
            v6:
                maybeV6ForwarderEncryptionKey.privateKey.getVersion() === 6
                    ? {
                          ID: maybeV6ForwarderEncryptionKey.ID,
                          supportsE2EEForwarding: false as const,
                      }
                    : undefined,
        };

        const isInternal = forwardeeKeysConfig.RecipientType === RECIPIENT_TYPES.TYPE_INTERNAL;
        const isExternal = forwardeeKeysConfig.RecipientType === RECIPIENT_TYPES.TYPE_EXTERNAL;
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
            forwardeePublicKey = forwardeeKeysConfig.publicKeys[0].publicKey;
            forwardeeEmailFromPublicKey = getEmailFromKey(forwardeePublicKey);
        }

        setModel({
            ...model,
            keyErrors: forwardeeKeysConfig.Errors,
            forwarderPrimaryKeysInfo,
            addresses,
            forwarderAddressKeys,
            forwardeePublicKey,
            forwardeeEmail: forwardeeEmailFromPublicKey || model.forwardeeEmail,
            isExternal,
            isInternal,
            step: Step.UserConfirmation,
        });
    };

    const handleUserConfirmation = () => {
        const getNextStep = () => {
            const isE2EEForwarding = !!(model.isInternal && model.forwardeePublicKey && model.forwarderPrimaryKeysInfo);
            if (!isE2EEForwarding) {
                return Step.FinalizeForwardingSetup;
            }

            if (model.forwarderPrimaryKeysInfo?.v6) {
                return Step.FixupPrimaryKeyV6;
            } else {
                return model.forwarderPrimaryKeysInfo?.v4.supportsE2EEForwarding
                    ? Step.FinalizeForwardingSetup
                    : Step.FixupUnsupportedPrimaryKeyV4;
            }
        };

        setModel({
            ...model,
            step: getNextStep(),
        });
    };

    const handleFixupPrimaryKeyV6 = async () => {
        if (!model.forwarderAddressKeys) {
            throw new Error('Missing address keys');
        }

        if (!model.forwarderPrimaryKeysInfo?.v6) {
            throw new Error('Missing primary key info');
        }

        await handleUnsetV6PrimaryKey({
            api,
            ID: model.forwarderPrimaryKeysInfo.v6.ID,
            forwarderAddress: getForwarderAddress(model.addresses),
            addressKeys: model.forwarderAddressKeys,
            User: await getUser(),
            userKeys: await getUserKeys(),
            dispatch,
            createKTVerifier,
        });
        createNotification({
            text: c('email_forwarding_2023: Success')
                .t`Post-quantum encryption for email messages has been disabled for ${forwarderEmail}.`,
        });

        // force re-fetch of addresses and address keys:
        // NB: this currently invalidates all address key references.
        await dispatch(addressesThunk({ cache: CacheType.None }));
        return setModel({
            ...model,
            addresses: await getAddresses(),
            forwarderAddressKeys: await getAddressKeys(model.addressID),
            forwarderPrimaryKeysInfo: {
                ...model.forwarderPrimaryKeysInfo,
                v6: undefined,
            },
            step: model.forwarderPrimaryKeysInfo.v4.supportsE2EEForwarding
                ? Step.FinalizeForwardingSetup
                : Step.FixupUnsupportedPrimaryKeyV4,
        });
    };

    const handleFixupUnsupportedPrimaryKeyV4 = async () => {
        if (!model.forwarderAddressKeys) {
            throw new Error('Missing address keys');
        }

        if (!model.forwarderPrimaryKeysInfo) {
            throw new Error('Missing primary key info');
        }

        if (model.forwarderPrimaryKeysInfo.v4.supportsE2EEForwarding) {
            throw new Error('Primary key already supports forwarding');
        }

        const forwarderAddress = getForwarderAddress(model.addresses);
        const newKey = await generateNewE2EEForwardingCompatibleAddressKey({
            api,
            forwarderAddress,
            addresses: model.addresses,
            addressKeys: model.forwarderAddressKeys,
            User: await getUser(),
            userKeys: await getUserKeys(),
            createKTVerifier,
            authentication,
        });

        createNotification({
            text: c('email_forwarding_2023: Success').t`A new encryption key has been generated for ${forwarderEmail}.`,
        });

        // force re-fetch of addresses and address keys:
        // NB: this currently invalidates all address key references.
        await dispatch(addressesThunk({ cache: CacheType.None }));
        return setModel({
            ...model,
            addresses: await getAddresses(),
            forwarderAddressKeys: await getAddressKeys(model.addressID),
            forwarderPrimaryKeysInfo: {
                ...model.forwarderPrimaryKeysInfo,
                v4: {
                    ID: newKey.ID,
                    supportsE2EEForwarding: true,
                },
            },
            step: Step.FinalizeForwardingSetup,
        });
    };

    const handleFinalizeForwardingSetup = async () => {
        if (!model.forwarderAddressKeys) {
            throw new Error('Missing address keys');
        }

        const setupForwardingParams: Omit<SetupForwardingParameters, 'Tree' /* added later */> = {
            ForwarderAddressID: model.addressID,
            ForwardeeEmail: model.forwardeeEmail,
            Type: model.isInternal ? ForwardingType.InternalEncrypted : ForwardingType.ExternalUnencrypted,
            Version: existingForwardingConfig?.Filter?.Version || 2,
        };

        // e2ee forwarding case
        if (model.isInternal && model.forwardeePublicKey && model.forwarderPrimaryKeysInfo) {
            const forwarderAddress = getForwarderAddress(model.addresses);
            // useGetAddressKeysByUsage would be preferable, but since we need the ActiveKey helpers
            // for the setup phase, we reuse them here.
            const activeKeysByVersion = await getActiveAddressKeys(
                forwarderAddress.SignedKeyList,
                model.forwarderAddressKeys
            );
            const forwarderKey = getPrimaryActiveAddressKeyForEncryption(
                activeKeysByVersion,
                // set for sanity checks: v6 is never actually returned, since it's dealt with above
                true
            ).privateKey as PrivateKeyReferenceV4;

            const { activationToken, forwardeeKey, proxyInstances } = await getInternalParametersPrivate(
                forwarderKey,
                [{ email: model.forwardeeEmail, name: model.forwardeeEmail }],
                model.forwardeePublicKey
            );

            const e2eeForwardingParams = {
                ForwardeePrivateKey: forwardeeKey,
                ActivationToken: activationToken,
                ProxyInstances: proxyInstances,
            };

            await api(
                isReEnablingForwarding
                    ? updateForwarding({
                          ID: existingForwardingConfig.ID,
                          ...e2eeForwardingParams,
                      })
                    : setupForwarding({
                          ...setupForwardingParams,
                          Tree: getSieveTree({
                              conditions: model.conditions,
                              statement: model.statement,
                              email: model.forwardeeEmail,
                          }),
                          ...e2eeForwardingParams,
                      })
            );
        } else {
            // Disable encryption if the email is external
            if (model.isExternal && addressFlags?.encryptionDisabled === false) {
                await addressFlags?.handleSetAddressFlags(true, addressFlags?.expectSignatureDisabled);
            }

            await api(
                setupForwarding({
                    ...setupForwardingParams,
                    Tree: getSieveTree({
                        conditions: model.conditions,
                        statement: model.statement,
                        email: model.forwardeeEmail,
                    }),
                })
            );
        }

        await call();
        onClose?.();
        createNotification({ text: c('email_forwarding_2023: Success').t`Email sent to ${model.forwardeeEmail}.` });
    };

    const handleSubmit = async () => {
        if (loading || !onFormSubmit()) {
            return;
        }

        if (isEditingFilters) {
            return handleEdit();
        }

        if (model.step === Step.Setup) {
            return handleSetup();
        }

        if (model.step === Step.UserConfirmation) {
            return handleUserConfirmation();
        }
    };

    const handleBack = () => {
        setModel({ ...model, step: Step.Setup });
    };

    useEffect(() => {
        if (model.step === Step.FixupPrimaryKeyV6) {
            void withLoading(handleFixupPrimaryKeyV6()).catch(() => {
                createNotification({ text: 'Error marking key as non primary', type: 'error' });
                handleBack();
            });
            return;
        }

        if (model.step === Step.FixupUnsupportedPrimaryKeyV4) {
            void withLoading(handleFixupUnsupportedPrimaryKeyV4()).catch(() => {
                createNotification({ text: 'Error generating new address key', type: 'error' });
                handleBack();
            });
            return;
        }

        if (model.step === Step.FinalizeForwardingSetup) {
            void withLoading(handleFinalizeForwardingSetup()).catch(() => {
                createNotification({ text: 'Error finalizing forwarding setup', type: 'error' });
                handleBack();
            });
            return;
        }
    }, [model.step]);

    const primaryKeyFixupDetails = getKeyFixupDetails(model.forwarderPrimaryKeysInfo, boldForwarderEmail);

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
                            {(isEditingFilters ? model.addresses : filterAddresses(model.addresses)).map(
                                ({ ID, Email, Receive }) => (
                                    <Option
                                        title={Email}
                                        key={ID}
                                        value={ID}
                                        disabled={Receive !== ADDRESS_RECEIVE.RECEIVE_YES}
                                    >
                                        {Email}
                                    </Option>
                                )
                            )}
                        </InputFieldTwo>
                        <InputFieldTwo
                            id="to-input"
                            label={c('email_forwarding_2023: Label').t`Forward to`}
                            placeholder={c('email_forwarding_2023: Placeholder').t`Enter email address`}
                            disabled={inputsDisabled}
                            disabledOnlyField={inputsDisabled}
                            readOnly={isEditingFilters || isReEnablingForwarding}
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
                {model.step === Step.UserConfirmation && (
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
                        {model.isExternal || !primaryKeyFixupDetails ? null : (
                            <div className="border rounded-lg p-4 flex flex-nowrap items-center mb-3">
                                <Icon name="exclamation-circle" className="shrink-0 color-danger" />
                                <p className="text-sm color-weak flex-1 pl-4 my-0">{primaryKeyFixupDetails}</p>
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
                {(model.step === Step.FixupPrimaryKeyV6 ||
                    model.step === Step.FixupUnsupportedPrimaryKeyV4 ||
                    model.step === Step.FinalizeForwardingSetup) && (
                    <>
                        <div className="text-center">
                            <img src={illustration} alt="" />
                            <p>{c('email_forwarding_2023: Info')
                                .jt`A confirmation email will be sent to ${boldForwardeeEmail}`}</p>
                            <p>{c('email_forwarding_2023: Info')
                                .t`Forwarding to this address will become active once the recipient accepts the forwarding.`}</p>
                            <div>
                                {c('Info').t`Finalizing forwarding setup`}
                                <EllipsisLoader />
                            </div>
                        </div>
                    </>
                )}
            </ModalTwoContent>
            <ModalTwoFooter>
                {model.step === Step.Setup && (
                    <>
                        <Button disabled={loading} type="reset">{c('email_forwarding_2023: Action').t`Cancel`}</Button>
                        <Button loading={loading} color="norm" type="submit">
                            {isEditingFilters
                                ? c('email_forwarding_2023: Action').t`Save`
                                : c('email_forwarding_2023: Action').t`Next`}
                        </Button>
                    </>
                )}
                {(model.step === Step.UserConfirmation ||
                    model.step === Step.FixupPrimaryKeyV6 ||
                    model.step === Step.FixupUnsupportedPrimaryKeyV4 ||
                    model.step === Step.FinalizeForwardingSetup) && (
                    <>
                        <Button onClick={handleBack} disabled={loading}>{c('email_forwarding_2023: Action')
                            .t`Back`}</Button>
                        <Button loading={loading} color="norm" type="submit">{c('email_forwarding_2023: Action')
                            .t`Send confirmation email`}</Button>
                    </>
                )}
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default ForwardModal;
