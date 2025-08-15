import { type ReactNode, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import { Button, Href } from '@proton/atoms';
import Form from '@proton/components/components/form/Form';
import Icon from '@proton/components/components/icon/Icon';
import LoadingTextStepper from '@proton/components/components/loader/LoadingTextStepper';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import { FilterStatement } from '@proton/components/containers/filters/interfaces';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useGetPublicKeysForInbox from '@proton/components/hooks/useGetPublicKeysForInbox';
import useNotifications from '@proton/components/hooks/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import { useContactEmails } from '@proton/mail/store/contactEmails/hooks';
import {
    type ForwardModalKeyState,
    editFilter,
    setupForwarding,
} from '@proton/mail/store/forwarding/outgoingForwardingActions';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { ADDRESS_RECEIVE } from '@proton/shared/lib/constants';
import { emailValidator, requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { Address, OutgoingAddressForwarding } from '@proton/shared/lib/interfaces';
import { ForwardingState } from '@proton/shared/lib/interfaces';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import forwardingSetupIllustration from '@proton/styles/assets/img/illustrations/forward-email-verification.svg';
import forwardingSuccessIllustration from '@proton/styles/assets/img/illustrations/forward-success-confirmation.svg';
import uniqueBy from '@proton/utils/uniqueBy';

import ForwardConditions from './ForwardConditions';
import { fixupPrimaryKeyV6, fixupUnsupportedPrimaryKeyV4, initForwardingSetup } from './ForwardModalActions';
import { type ForwardModalState, ForwardModalStep } from './ForwardModalInterface';
import { getSieveParameters, getSieveTree } from './helpers';

interface Props extends ModalProps {
    existingForwardingConfig?: OutgoingAddressForwarding;
}

const getDefaultForwardModalState = ({
    existingForwardingConfig,
    addresses,
}: {
    addresses: Address[];
    existingForwardingConfig?: OutgoingAddressForwarding;
}): ForwardModalState => {
    const { statement, conditions } = existingForwardingConfig
        ? getSieveParameters(existingForwardingConfig.Filter?.Tree || [])
        : { statement: FilterStatement.ALL, conditions: [] };

    const [primaryAddress] = addresses;
    if (!primaryAddress) {
        throw new Error('Missing primary address');
    }
    return {
        step: ForwardModalStep.Setup,
        addressID: existingForwardingConfig ? existingForwardingConfig.ForwarderAddressID : primaryAddress.ID,
        forwardeeEmail: existingForwardingConfig ? existingForwardingConfig.ForwardeeEmail : '',
        statement,
        conditions,
    };
};

const getForwarderAddress = (addresses: Address[], addressID: string) => {
    const address = addresses.find(({ ID }) => ID === addressID);
    if (!address) {
        throw new Error('Missing forwarder address');
    }
    return address;
};

const getEncryptionFixupDetails = (
    isExternalRecipient: boolean | undefined,
    forwarderPrimaryKeysInfo: ForwardModalKeyState['forwarderPrimaryKeysInfo'] | undefined,
    boldForwarderEmail: ReactNode
) => {
    if (isExternalRecipient) {
        const learnMoreLink = (
            <Href href={getKnowledgeBaseUrl('/email-forwarding')} key="learn-more">{c('email_forwarding_2023: Link')
                .t`Learn more`}</Href>
        );

        return {
            setup: c('email_forwarding_2023: Info')
                .jt`Forwarding to an address without end-to-end encryption will disable end-to-end encryption for your ${boldForwarderEmail} address, but zero-access encryption remains enabled. ${learnMoreLink}`,
            success: c('email_forwarding_2023: Info')
                .jt`End-to-end encryption has been disabled for your ${boldForwarderEmail} address, but zero-access encryption remains enabled. ${learnMoreLink}`,
        };
    }

    if (!forwarderPrimaryKeysInfo) {
        return null;
    }

    if (forwarderPrimaryKeysInfo.v4.supportsE2EEForwarding) {
        return forwarderPrimaryKeysInfo?.v6
            ? {
                  setup: c('email_forwarding_2023: Info')
                      .jt`For compatibility, post-quantum encryption will be disabled for ${boldForwarderEmail}.`,
                  success: c('email_forwarding_2023: Info')
                      .jt`For compatibility, post-quantum encryption has been disabled for ${boldForwarderEmail}.`,
              }
            : null;
    } else {
        return forwarderPrimaryKeysInfo?.v6
            ? {
                  setup: c('email_forwarding_2023: Info')
                      .jt`For compatibility, post-quantum encryption will be disabled, and a new encryption key will be generated for ${boldForwarderEmail}.`,
                  success: c('email_forwarding_2023: Info')
                      .jt`For compatibility, post-quantum encryption has been be disabled, and a new encryption key has been generated for ${boldForwarderEmail}.`,
              }
            : {
                  setup: c('email_forwarding_2023: Info')
                      .jt`For compatibility, a new encryption key will be generated for ${boldForwarderEmail}.`,
                  success: c('email_forwarding_2023: Info')
                      .jt`For compatibility, a new encryption key has been generated for ${boldForwarderEmail}.`,
              };
    }
};

const getTitle = (model: ForwardModalState) => {
    if (model.step === ForwardModalStep.Setup) {
        return c('email_forwarding_2023: Title').t`Set up forwarding`;
    }

    if (model.step === ForwardModalStep.UserConfirmation) {
        return c('email_forwarding_2023: Title').t`Request confirmation?`;
    }

    if (model.step === ForwardModalStep.FixupPrimaryKeys || model.step === ForwardModalStep.FinalizeForwardingSetup) {
        return c('email_forwarding_2023: Title').t`Requesting confirmation`;
    }

    if (model.step === ForwardModalStep.SuccessNotification) {
        return c('email_forwarding_2023: Title').t`Request sent`;
    }

    return '';
};

const compareContactEmailByEmail = (a: ContactEmail, b: ContactEmail) => {
    return a.Email.localeCompare(b.Email);
};

const ForwardModal = ({ existingForwardingConfig, onClose, ...rest }: Props) => {
    const isEditingFilters =
        existingForwardingConfig?.State === ForwardingState.Active ||
        existingForwardingConfig?.State === ForwardingState.Pending;
    const isReEnablingForwarding = existingForwardingConfig?.State === ForwardingState.Outdated;
    const [addresses = []] = useAddresses();
    const [contactEmails = []] = useContactEmails();
    const contactEmailsSorted = useMemo(() => {
        const uniqueEmails = uniqueBy(contactEmails, ({ Email }) => Email.toLowerCase());
        const sortedEmails = [...uniqueEmails].sort(compareContactEmailByEmail);
        return sortedEmails;
    }, [contactEmails]);
    const getPublicKeysForInbox = useGetPublicKeysForInbox();
    const { createNotification } = useNotifications();
    const { validator, onFormSubmit } = useFormErrors();
    const [loading, withLoading] = useLoading();
    const filterAddresses = (addresses: Address[]) =>
        addresses.filter(({ Receive }) => Receive === ADDRESS_RECEIVE.RECEIVE_YES);
    const [model, setModel] = useState<ForwardModalState>(
        getDefaultForwardModalState({ existingForwardingConfig, addresses: filterAddresses(addresses) })
    );
    const handleError = useErrorHandler();
    const keyStateRef = useRef<ForwardModalKeyState | null>(null);

    const inputsDisabled = model.loading || isEditingFilters || isReEnablingForwarding;
    const initialForwarderAddress = getForwarderAddress(addresses, model.addressID);
    const dispatch = useDispatch();

    const forwarderEmail = initialForwarderAddress?.Email || '';

    const boldForwardeeEmail = <strong key="forwardee-email">{model.forwardeeEmail}</strong>;
    const boldForwarderEmail = <strong key="forwarder-email">{forwarderEmail}</strong>;

    const handleEdit = async () => {
        if (!existingForwardingConfig) {
            throw new Error('Invalid state');
        }
        await dispatch(
            editFilter({
                forward: existingForwardingConfig,
                sieveTree: getSieveTree({
                    conditions: model.conditions,
                    statement: model.statement,
                    email: model.forwardeeEmail,
                }),
            })
        );
        onClose?.();
        createNotification({ text: c('email_forwarding_2023: Success').t`Changes saved` });
    };

    const handleSetup = async () => {
        const { keyState, modelState } = await dispatch(
            initForwardingSetup({
                forwarderAddressID: model.addressID,
                email: model.forwardeeEmail,
                getPublicKeysForInbox,
            })
        );

        keyStateRef.current = keyState;

        setModel({
            ...model,
            ...modelState,
            encryptionFixupDetails: getEncryptionFixupDetails(
                modelState.isExternal,
                keyState.forwarderPrimaryKeysInfo,
                boldForwarderEmail
            ),
            step: ForwardModalStep.UserConfirmation,
        });
    };

    const handleFinalizeSetup = async () => {
        if (!keyStateRef.current) {
            throw new Error('Invalid state');
        }

        const forwardeeEmail = model.forwardeeEmail;
        await dispatch(
            setupForwarding({
                forwarderAddressID: model.addressID,
                forwardeeEmail,
                forward: existingForwardingConfig,
                sieveTree: getSieveTree({
                    conditions: model.conditions,
                    statement: model.statement,
                    email: forwardeeEmail,
                }),
                keyState: keyStateRef.current,
                isInternal: model.isInternal,
                isExternal: model.isExternal,
                isReEnablingForwarding,
            })
        );

        setModel({ ...model, step: ForwardModalStep.SuccessNotification });
    };

    const handleUserConfirmation = async () => {
        const keyState = keyStateRef.current;

        const isE2EEForwarding = !!(
            model.isInternal &&
            keyState &&
            keyState.forwardeePublicKey &&
            keyState.forwarderPrimaryKeysInfo
        );

        if (isE2EEForwarding && keyState.forwarderPrimaryKeysInfo?.v6) {
            setModel({ ...model, step: ForwardModalStep.FixupPrimaryKeys });

            const result = await dispatch(
                fixupPrimaryKeyV6({
                    forwarderAddressID: model.addressID,
                    keyState,
                })
            );
            keyStateRef.current = result.keyState;
            return handleUserConfirmation();
        }

        if (isE2EEForwarding && !keyState.forwarderPrimaryKeysInfo.v4.supportsE2EEForwarding) {
            setModel({ ...model, step: ForwardModalStep.FixupPrimaryKeys });

            const result = await dispatch(
                fixupUnsupportedPrimaryKeyV4({
                    forwarderAddressID: model.addressID,
                    keyState,
                })
            );
            keyStateRef.current = result.keyState;
            return handleUserConfirmation();
        }

        setModel({ ...model, step: ForwardModalStep.FinalizeForwardingSetup });
        return handleFinalizeSetup();
    };

    const handleBack = () => {
        setModel((prev) => ({ ...prev, step: ForwardModalStep.Setup }));
    };

    const handleSubmit = async () => {
        if (loading || !onFormSubmit()) {
            return;
        }

        if (isEditingFilters) {
            return handleEdit();
        }

        if (model.step === ForwardModalStep.Setup) {
            return handleSetup();
        }

        if (model.step === ForwardModalStep.UserConfirmation) {
            return handleUserConfirmation().catch((e) => {
                handleBack();
                throw e;
            });
        }
    };

    return (
        <ModalTwo
            as={Form}
            size={model.step === ForwardModalStep.SuccessNotification ? 'xsmall' : undefined}
            onClose={onClose}
            onSubmit={() =>
                withLoading(
                    handleSubmit().catch((e) => {
                        console.trace(e);
                        handleError(e);
                    })
                )
            }
            onReset={() => {
                onClose?.();
            }}
            {...rest}
        >
            <ModalTwoHeader
                title={getTitle(model)}
                hasClose={model.step === ForwardModalStep.Setup || model.step === ForwardModalStep.UserConfirmation}
            />
            <ModalTwoContent>
                {model.step === ForwardModalStep.Setup && (
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
                            {(isEditingFilters ? addresses : filterAddresses(addresses)).map(
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
                {model.step === ForwardModalStep.UserConfirmation && (
                    <>
                        <div className="text-center">
                            <img src={forwardingSetupIllustration} alt="" />
                            <p>{c('email_forwarding_2023: Info')
                                .jt`A confirmation email will be sent to ${boldForwardeeEmail}`}</p>
                            {model.encryptionFixupDetails ? null /* hide this info to make the fixup details below more visible */ : (
                                <p>{c('email_forwarding_2023: Info')
                                    .t`Forwarding to this address will become active once the recipient accepts the forwarding.`}</p>
                            )}
                        </div>
                        {model.encryptionFixupDetails ? (
                            <div className="border rounded-lg p-4 flex flex-nowrap items-center mb-3">
                                <Icon name="exclamation-circle-filled" className="shrink-0 color-warning" />
                                <p className="text-sm color-weak flex-1 pl-4 my-0">
                                    {model.encryptionFixupDetails.setup}
                                </p>
                            </div>
                        ) : null}
                    </>
                )}
                {(model.step === ForwardModalStep.FixupPrimaryKeys ||
                    model.step === ForwardModalStep.FinalizeForwardingSetup) && (
                    <>
                        <div className="text-center">
                            <img src={forwardingSetupIllustration} alt="" />
                            <div className="text-center" role="alert">
                                <div className="inline-block">
                                    <LoadingTextStepper
                                        steps={[
                                            c('email_forwarding_2023: Progress status').t`Setting up forwarding`,
                                            c('email_forwarding_2023: Progress status').t`Sending confirmation email`,
                                        ]}
                                        stepIndex={model.step === ForwardModalStep.FixupPrimaryKeys ? 0 : 1}
                                        hideFutureSteps={false}
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                )}
                {model.step === ForwardModalStep.SuccessNotification && (
                    <>
                        <div className="text-center">
                            <img src={forwardingSuccessIllustration} alt="" />
                            <p>
                                {c('email_forwarding_2023: Info')
                                    .jt`Forwarding to ${boldForwardeeEmail} will become active once the recipient accepts the request.`}
                            </p>
                            {model.encryptionFixupDetails ? <p>{model.encryptionFixupDetails.success}</p> : null}
                        </div>
                    </>
                )}
            </ModalTwoContent>
            <ModalTwoFooter>
                {model.step === ForwardModalStep.Setup && (
                    <>
                        <Button disabled={loading} type="reset">{c('email_forwarding_2023: Action').t`Cancel`}</Button>
                        <Button loading={loading} color="norm" type="submit">
                            {isEditingFilters
                                ? c('email_forwarding_2023: Action').t`Save`
                                : c('email_forwarding_2023: Action').t`Next`}
                        </Button>
                    </>
                )}
                {model.step === ForwardModalStep.UserConfirmation && (
                    <>
                        <Button onClick={handleBack} disabled={loading}>
                            {c('email_forwarding_2023: Action').t`Back`}
                        </Button>
                        <Button loading={loading} color="norm" type="submit">
                            {c('email_forwarding_2023: Action').t`Send confirmation email`}
                        </Button>
                    </>
                )}
                {model.step === ForwardModalStep.SuccessNotification && (
                    <Button onClick={onClose} fullWidth={true}>
                        {c('email_forwarding_2023: Action').t`Got it`}
                    </Button>
                )}
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default ForwardModal;
