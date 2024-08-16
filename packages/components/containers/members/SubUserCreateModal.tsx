import type { FormEvent } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import {
    InvalidAddressesError,
    MemberCreationValidationError,
    UnavailableAddressesError,
    createMember,
    getPrivateAdminError,
} from '@proton/account';
import { Button, InlineLinkButton } from '@proton/atoms';
import { useLoading } from '@proton/hooks';
import { useDispatch } from '@proton/redux-shared-store';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { BRAND_NAME, MAIL_APP_NAME, MEMBER_ROLE, VPN_CONNECTIONS } from '@proton/shared/lib/constants';
import { getEmailParts } from '@proton/shared/lib/helpers/email';
import {
    confirmPasswordValidator,
    emailValidator,
    passwordLengthValidator,
    requiredValidator,
} from '@proton/shared/lib/helpers/formValidators';
import { sizeUnits } from '@proton/shared/lib/helpers/size';
import { getHasVpnB2BPlan, hasVisionary } from '@proton/shared/lib/helpers/subscription';
import type { Domain, EnhancedMember, Organization } from '@proton/shared/lib/interfaces';
import { CreateMemberMode } from '@proton/shared/lib/interfaces';
import { getIsPasswordless } from '@proton/shared/lib/keys';
import { useFlag } from '@proton/unleash';
import clamp from '@proton/utils/clamp';
import isTruthy from '@proton/utils/isTruthy';

import type { ModalProps } from '../../components';
import {
    DropdownSizeUnit,
    Icon,
    Info,
    InputFieldTwo,
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
    Option,
    PasswordInputTwo,
    SelectTwo,
    Toggle,
    Tooltip,
    useFormErrors,
} from '../../components';
import {
    useApi,
    useErrorHandler,
    useEventManager,
    useGetUser,
    useNotifications,
    useOrganizationKey,
    useSubscription,
} from '../../hooks';
import { useKTVerifier } from '../keyTransparency';
import useVerifyOutboundPublicKeys from '../keyTransparency/useVerifyOutboundPublicKeys';
import { AssistantUpdateSubscriptionButton } from '../payments';
import MemberStorageSelector, { getInitialStorage, getStorageRange, getTotalStorage } from './MemberStorageSelector';
import SubUserBulkCreateModal from './SubUserBulkCreateModal';
import SubUserCreateHint from './SubUserCreateHint';
import { adminTooltipText } from './constants';

enum Step {
    SINGLE,
    BULK,
}

interface Props extends ModalProps {
    organization?: Organization;
    verifiedDomains: Domain[];
    members: EnhancedMember[] | undefined;
    app: APP_NAMES;
    onSuccess?: () => void;
    optionalName?: boolean;
    useEmail?: boolean;
    allowStorageConfiguration?: boolean;
    allowVpnAccessConfiguration?: boolean;
    allowPrivateMemberConfiguration?: boolean;
    allowAIAssistantConfiguration?: boolean;
    showMultipleUserUploadButton?: boolean;
    disableStorageValidation?: boolean;
    disableDomainValidation?: boolean;
    disableAddressValidation?: boolean;
    aiSeatsRemaining: boolean;
}

const SubUserCreateModal = ({
    organization,
    members,
    verifiedDomains,
    onClose,
    app,
    onSuccess,
    optionalName,
    useEmail,
    allowStorageConfiguration,
    allowVpnAccessConfiguration,
    allowPrivateMemberConfiguration,
    allowAIAssistantConfiguration,
    showMultipleUserUploadButton,
    disableStorageValidation,
    disableDomainValidation,
    disableAddressValidation,
    aiSeatsRemaining,
    ...rest
}: Props) => {
    const { createNotification } = useNotifications();
    const { call, stop, start } = useEventManager();
    const normalApi = useApi();
    const silentApi = getSilentApi(normalApi);
    const dispatch = useDispatch();
    const [organizationKey] = useOrganizationKey();
    const storageSizeUnit = sizeUnits.GB;
    const storageRange = getStorageRange({}, organization);
    const errorHandler = useErrorHandler();
    const verifyOutboundPublicKeys = useVerifyOutboundPublicKeys();
    const passwordlessMode = getIsPasswordless(organizationKey?.Key);

    const [subscription] = useSubscription();
    const hasVpnB2bPlan = getHasVpnB2BPlan(subscription);
    const isVisionary = hasVisionary(subscription);

    const [step, setStep] = useState<Step>(Step.SINGLE);

    const hasVPN = Boolean(organization?.MaxVPN);

    const isMagicLinkEnabled = useFlag('MagicLink');
    const csvMode = isMagicLinkEnabled ? CreateMemberMode.Invitation : CreateMemberMode.Password;

    const [model, setModel] = useState({
        mode: isMagicLinkEnabled ? CreateMemberMode.Invitation : CreateMemberMode.Password,
        name: '',
        private: false,
        admin: false,
        password: '',
        confirm: '',
        address: '',
        invitationEmail: '',
        numAI: aiSeatsRemaining || isVisionary, // Visionary users should have the toggle set to true by default
        domain: useEmail ? null : (verifiedDomains[0]?.DomainName ?? null),
        vpn:
            organization &&
            hasVPN &&
            (hasVpnB2bPlan ? true : organization.MaxVPN - organization.UsedVPN >= VPN_CONNECTIONS),
        storage: clamp(getInitialStorage(organization), storageRange.min, storageRange.max),
    });

    const { keyTransparencyVerify, keyTransparencyCommit } = useKTVerifier(silentApi, useGetUser());
    const [submitting, withLoading] = useLoading();

    const { validator, onFormSubmit } = useFormErrors();

    const domainOptions = verifiedDomains.map(({ DomainName }) => ({ text: DomainName, value: DomainName }));

    const setModelDiff = (diff: Partial<typeof model>) => {
        setModel((previous) => ({ ...previous, ...diff }));
    };

    const handleChange = (key: keyof typeof model) => (value: (typeof model)[typeof key]) => {
        return setModelDiff({ [key]: value });
    };

    const getNormalizedAddress = () => {
        // In email & invititation mode, the invited address is the same as the created address
        if (useEmail && model.mode === CreateMemberMode.Invitation) {
            const [Local, Domain] = getEmailParts(model.invitationEmail.trim());
            return { Local, Domain };
        }

        const address = model.address.trim();

        if (model.domain && !useEmail) {
            return { Local: address, Domain: model.domain };
        }

        const [Local, Domain] = getEmailParts(address);

        return { Local, Domain };
    };

    const emailAddressParts = getNormalizedAddress();
    const emailAddress = `${emailAddressParts.Local}@${emailAddressParts.Domain}`;

    const save = async () => {
        try {
            return await dispatch(
                createMember({
                    api: silentApi,
                    member: {
                        ...model,
                        addresses: [emailAddressParts],
                        role: model.admin ? MEMBER_ROLE.ORGANIZATION_ADMIN : MEMBER_ROLE.ORGANIZATION_MEMBER,
                        numAI: model.numAI,
                    },
                    verifiedDomains,
                    validationOptions: {
                        disableStorageValidation,
                        disableDomainValidation,
                        disableAddressValidation,
                    },
                    keyTransparencyCommit,
                    keyTransparencyVerify,
                    verifyOutboundPublicKeys,
                })
            );
        } catch (error) {
            if (error instanceof InvalidAddressesError) {
                throw new MemberCreationValidationError(c('Error').t`Email address is invalid`);
            } else if (error instanceof UnavailableAddressesError) {
                const first = error.unavailableAddresses[0];
                throw new MemberCreationValidationError(first.message || c('Error').t`Email address is not available`);
            }
            throw error;
        }
    };

    const handleSubmit = async () => {
        stop();
        await save().finally(start);
        await call();
        onClose?.();
        createNotification({ text: c('user_modal').t`User created` });

        onSuccess?.();
    };

    const setBulkStep = () => {
        setStep(Step.BULK);
    };
    const setSingleStep = () => {
        setStep(Step.SINGLE);
    };

    const handleClose = () => {
        if (!submitting) {
            onClose?.();
            setSingleStep();
        }
    };

    if (step === Step.BULK) {
        return (
            <SubUserBulkCreateModal
                open
                mode={isMagicLinkEnabled ? CreateMemberMode.Invitation : CreateMemberMode.Password}
                verifiedDomains={verifiedDomains}
                members={members}
                onBack={setSingleStep}
                onClose={handleClose}
                app={app}
                disableStorageValidation={disableStorageValidation}
                disableDomainValidation={disableDomainValidation}
                disableAddressValidation={disableAddressValidation}
                csvConfig={{
                    mode: csvMode,
                    multipleAddresses: !useEmail,
                    includeStorage: allowStorageConfiguration,
                    includeVpnAccess: allowVpnAccessConfiguration,
                    includePrivateSubUser: allowPrivateMemberConfiguration,
                }}
            />
        );
    }

    const addressSuffix = (() => {
        if (domainOptions.length === 0) {
            return null;
        }

        if (domainOptions.length === 1) {
            return (
                <span className="text-ellipsis" title={`@${domainOptions[0].value}`}>
                    @{domainOptions[0].value}
                </span>
            );
        }

        return (
            <SelectTwo
                unstyled
                originalPlacement="bottom-end"
                size={{ width: DropdownSizeUnit.Static }}
                value={model.domain}
                onChange={({ value }) => handleChange('domain')(value)}
            >
                {domainOptions.map((option) => (
                    <Option key={option.value} value={option.value} title={option.text}>
                        @{option.text}
                    </Option>
                ))}
            </SelectTwo>
        );
    })();

    const protonAddressInfo = (
        <Info
            buttonClass="align-text-bottom"
            title={c('user_modal').t`This will create a new ${MAIL_APP_NAME} address.`}
        />
    );
    const protonAddressLabel = (
        <span>
            {c('user_modal').t`New ${BRAND_NAME} email address`} {protonAddressInfo}
        </span>
    );

    return (
        <Modal
            as="form"
            {...rest}
            onClose={handleClose}
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                event.stopPropagation();
                if (!onFormSubmit(event.currentTarget)) {
                    return;
                }
                void withLoading(handleSubmit()).catch(errorHandler);
            }}
        >
            <ModalHeader title={c('user_modal').t`Add new user`} />
            <ModalContent>
                <InputFieldTwo
                    id="name"
                    autoFocus
                    value={model.name}
                    hint={optionalName ? c('user_modal').t`Optional` : undefined}
                    error={validator([!optionalName && requiredValidator(model.name)].filter(isTruthy))}
                    onValue={handleChange('name')}
                    label={c('user_modal').t`Name`}
                />
                {model.mode === CreateMemberMode.Password && (
                    <>
                        <InputFieldTwo
                            id="address"
                            value={model.address}
                            error={validator([requiredValidator(model.address), emailValidator(emailAddress)])}
                            onValue={handleChange('address')}
                            label={useEmail ? c('user_modal').t`Email` : protonAddressLabel}
                            suffix={useEmail ? undefined : addressSuffix}
                        />

                        <InputFieldTwo
                            id="password"
                            as={PasswordInputTwo}
                            value={model.password}
                            error={validator([
                                requiredValidator(model.password),
                                passwordLengthValidator(model.password),
                            ])}
                            onValue={handleChange('password')}
                            label={c('user_modal').t`Create password`}
                        />

                        <InputFieldTwo
                            id="confirm-password"
                            as={PasswordInputTwo}
                            value={model.confirm}
                            error={validator([
                                requiredValidator(model.confirm),
                                confirmPasswordValidator(model.password, model.confirm),
                            ])}
                            onValue={handleChange('confirm')}
                            label={c('user_modal').t`Confirm password`}
                        />

                        {isMagicLinkEnabled && (
                            <SubUserCreateHint className="mb-4 bg-weak">
                                {c('user_modal').t`Remember to share the user's sign in details with them.`}{' '}
                                <InlineLinkButton onClick={() => setModelDiff({ mode: CreateMemberMode.Invitation })}>
                                    {c('user_modal').t`Send invite link via email instead`}
                                </InlineLinkButton>
                            </SubUserCreateHint>
                        )}
                    </>
                )}
                {model.mode === CreateMemberMode.Invitation && (
                    <>
                        {!useEmail && (
                            <InputFieldTwo
                                id="address"
                                value={model.address}
                                error={validator([requiredValidator(model.address), emailValidator(emailAddress)])}
                                onValue={handleChange('address')}
                                label={protonAddressLabel}
                                suffix={addressSuffix}
                            />
                        )}
                        <InputFieldTwo
                            id="invitation-email"
                            rootClassName="mb-4"
                            value={model.invitationEmail}
                            error={validator([
                                requiredValidator(model.invitationEmail),
                                emailValidator(model.invitationEmail),
                            ])}
                            onValue={handleChange('invitationEmail')}
                            label={c('user_modal').t`Invitation email`}
                            assistiveText={
                                <>
                                    {c('user_modal').t`An invitation will be sent to this email address.`}&nbsp;
                                    <InlineLinkButton
                                        className="inline-block"
                                        onClick={() => setModelDiff({ mode: CreateMemberMode.Password })}
                                    >
                                        {c('user_modal').t`Create password instead`}
                                    </InlineLinkButton>
                                </>
                            }
                        />
                    </>
                )}

                {allowStorageConfiguration && (
                    <MemberStorageSelector
                        className="mb-5"
                        value={model.storage}
                        sizeUnit={storageSizeUnit}
                        range={storageRange}
                        totalStorage={getTotalStorage({}, organization)}
                        onChange={handleChange('storage')}
                    />
                )}

                {allowVpnAccessConfiguration && hasVPN && (
                    <div className="flex items-center gap-2 mb-5">
                        <Toggle
                            id="vpn-toggle"
                            checked={model.vpn}
                            onChange={({ target }) => handleChange('vpn')(target.checked)}
                        />
                        <label className="text-semibold" htmlFor="vpn-toggle">
                            {c('user_modal').t`VPN connections`}
                        </label>
                    </div>
                )}

                {allowPrivateMemberConfiguration && (
                    <div className="flex items-center gap-2 mb-6">
                        <Toggle
                            id="private-toggle"
                            checked={model.private}
                            onChange={({ target }) => handleChange('private')(target.checked)}
                        />
                        <label className="text-semibold" htmlFor="private-toggle">
                            {c('user_modal').t`Private`}
                        </label>
                    </div>
                )}

                {model.mode === CreateMemberMode.Password && (
                    <>
                        <div className="flex items-center gap-2 mb-6">
                            <Toggle
                                id="admin-toggle"
                                checked={model.admin}
                                onChange={({ target }) => handleChange('admin')(target.checked)}
                            />
                            <label className="text-semibold" htmlFor="admin-toggle">
                                {c('user_modal').t`Admin`}
                            </label>
                            <Tooltip title={adminTooltipText()}>
                                <Icon name="info-circle" className="color-primary" />
                            </Tooltip>
                            {passwordlessMode && model.private && model.admin && (
                                <Tooltip title={getPrivateAdminError()} openDelay={0}>
                                    <Icon className="color-danger ml-2" name="info-circle-filled" />
                                </Tooltip>
                            )}
                        </div>
                    </>
                )}

                {allowAIAssistantConfiguration && (
                    <div className="flex items-center gap-2 mb-6">
                        <Toggle
                            id="ai-assistant-toggle"
                            checked={model.numAI}
                            disabled={!aiSeatsRemaining}
                            onChange={({ target }) => handleChange('numAI')(target.checked)}
                        />
                        <label className="text-semibold" htmlFor="ai-assistant-toggle">
                            {c('user_modal').t`Writing assistant`}
                        </label>
                        {!aiSeatsRemaining && !model.numAI && <AssistantUpdateSubscriptionButton />}
                    </div>
                )}

                {model.mode !== CreateMemberMode.Password && (
                    <SubUserCreateHint className="mb-4">
                        {c('Info')
                            .t`You will be able to promote the user to administrator once they've accepted the invitation.`}
                    </SubUserCreateHint>
                )}
            </ModalContent>
            <ModalFooter>
                {showMultipleUserUploadButton ? (
                    <Button onClick={setBulkStep} disabled={submitting}>
                        {c('user_modal').t`Add multiple users`}
                    </Button>
                ) : (
                    <Button onClick={handleClose} disabled={submitting}>
                        {c('user_modal').t`Cancel`}
                    </Button>
                )}
                <Button loading={submitting} type="submit" color="norm">
                    {c('user_modal').t`Create user`}
                </Button>
            </ModalFooter>
        </Modal>
    );
};
export default SubUserCreateModal;
