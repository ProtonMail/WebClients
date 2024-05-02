import { FormEvent, useState } from 'react';

import { c } from 'ttag';

import { createMember, getPrivateAdminError } from '@proton/account';
import { Button } from '@proton/atoms';
import { useLoading } from '@proton/hooks';
import { useDispatch } from '@proton/redux-shared-store';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { APP_NAMES, GIGA, MEMBER_ROLE, VPN_CONNECTIONS } from '@proton/shared/lib/constants';
import { getEmailParts } from '@proton/shared/lib/helpers/email';
import {
    confirmPasswordValidator,
    emailValidator,
    passwordLengthValidator,
    requiredValidator,
} from '@proton/shared/lib/helpers/formValidators';
import { getHasVpnB2BPlan } from '@proton/shared/lib/helpers/subscription';
import { Domain, EnhancedMember, Organization } from '@proton/shared/lib/interfaces';
import { getIsPasswordless } from '@proton/shared/lib/keys';
import clamp from '@proton/utils/clamp';
import isTruthy from '@proton/utils/isTruthy';

import {
    DropdownSizeUnit,
    Icon,
    InputFieldTwo,
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
    ModalProps,
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
import MemberStorageSelector, { getStorageRange, getTotalStorage } from './MemberStorageSelector';
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
    showMultipleUserUploadButton?: boolean;
    disableStorageValidation?: boolean;
    disableDomainValidation?: boolean;
    disableAddressValidation?: boolean;
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
    showMultipleUserUploadButton,
    disableStorageValidation,
    disableDomainValidation,
    disableAddressValidation,
    ...rest
}: Props) => {
    const { createNotification } = useNotifications();
    const { call, stop, start } = useEventManager();
    const normalApi = useApi();
    const silentApi = getSilentApi(normalApi);
    const dispatch = useDispatch();
    const [organizationKey] = useOrganizationKey();
    const storageSizeUnit = GIGA;
    const storageRange = getStorageRange({}, organization);
    const errorHandler = useErrorHandler();
    const verifyOutboundPublicKeys = useVerifyOutboundPublicKeys();
    const passwordlessMode = getIsPasswordless(organizationKey?.Key);

    const [subscription] = useSubscription();
    const hasVpnB2bPlan = getHasVpnB2BPlan(subscription);

    const [step, setStep] = useState<Step>(Step.SINGLE);

    const hasVPN = Boolean(organization?.MaxVPN);

    const [model, setModel] = useState({
        name: '',
        private: false,
        admin: false,
        password: '',
        confirm: '',
        address: '',
        domain: useEmail ? null : verifiedDomains[0]?.DomainName ?? null,
        vpn:
            organization &&
            hasVPN &&
            (hasVpnB2bPlan ? true : organization.MaxVPN - organization.UsedVPN >= VPN_CONNECTIONS),
        storage: clamp(5 * GIGA, storageRange.min, storageRange.max),
    });
    const { keyTransparencyVerify, keyTransparencyCommit } = useKTVerifier(silentApi, useGetUser());
    const [submitting, withLoading] = useLoading();

    const { validator, onFormSubmit } = useFormErrors();

    const domainOptions = verifiedDomains.map(({ DomainName }) => ({ text: DomainName, value: DomainName }));

    const handleChange = (key: keyof typeof model) => (value: (typeof model)[typeof key]) =>
        setModel({ ...model, [key]: value });

    const getNormalizedAddress = () => {
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
        return dispatch(
            createMember({
                api: silentApi,
                member: {
                    ...model,
                    address: emailAddressParts,
                    role: model.admin ? MEMBER_ROLE.ORGANIZATION_ADMIN : MEMBER_ROLE.ORGANIZATION_MEMBER,
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
    };

    const handleSubmit = async () => {
        stop();
        await save().finally(start);
        await call();
        onClose?.();
        createNotification({ text: c('Success').t`User created` });

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
                verifiedDomains={verifiedDomains}
                members={members}
                onBack={setSingleStep}
                onClose={handleClose}
                app={app}
                disableStorageValidation={disableStorageValidation}
                disableDomainValidation={disableDomainValidation}
                disableAddressValidation={disableAddressValidation}
                csvConfig={{
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
            <ModalHeader title={c('Title').t`Add new user`} />
            <ModalContent>
                <InputFieldTwo
                    id="name"
                    autoFocus
                    value={model.name}
                    hint={optionalName ? c('Info').t`Optional` : undefined}
                    error={validator([!optionalName && requiredValidator(model.name)].filter(isTruthy))}
                    onValue={handleChange('name')}
                    label={c('Label').t`Name`}
                />
                <InputFieldTwo
                    id="address"
                    value={model.address}
                    error={validator([requiredValidator(model.address), emailValidator(emailAddress)])}
                    onValue={handleChange('address')}
                    label={useEmail ? c('Label').t`Email` : c('Label').t`Address`}
                    suffix={useEmail ? undefined : addressSuffix}
                />
                <InputFieldTwo
                    id="password"
                    as={PasswordInputTwo}
                    value={model.password}
                    error={validator([requiredValidator(model.password), passwordLengthValidator(model.password)])}
                    onValue={handleChange('password')}
                    label={c('Label').t`Create password`}
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
                    label={c('Label').t`Confirm password`}
                />

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
                    <div className="flex mb-5">
                        <label className="text-semibold mr-4" htmlFor="vpn-toggle">
                            {c('Label for new member').t`VPN connections`}
                        </label>
                        <Toggle
                            id="vpn-toggle"
                            checked={model.vpn}
                            onChange={({ target }) => handleChange('vpn')(target.checked)}
                        />
                    </div>
                )}

                {allowPrivateMemberConfiguration && (
                    <div className="flex mb-6">
                        <label className="text-semibold mr-4" htmlFor="private-toggle">
                            {c('Label for new member').t`Private`}
                        </label>
                        <Toggle
                            id="private-toggle"
                            checked={model.private}
                            onChange={({ target }) => handleChange('private')(target.checked)}
                        />
                    </div>
                )}

                <div className="flex items-center mb-6">
                    <label className="text-semibold mr-1" htmlFor="admin-toggle">
                        {c('Label for new member').t`Admin`}
                    </label>
                    <Tooltip title={adminTooltipText}>
                        <Icon name="info-circle" className="color-primary" />
                    </Tooltip>
                    <Toggle
                        id="admin-toggle"
                        className="ml-2"
                        checked={model.admin}
                        onChange={({ target }) => handleChange('admin')(target.checked)}
                    />
                    {passwordlessMode && model.private && model.admin && (
                        <Tooltip title={getPrivateAdminError()} openDelay={0}>
                            <Icon className="color-danger ml-2" name="info-circle-filled" />
                        </Tooltip>
                    )}
                </div>
                <SubUserCreateHint className="mt-8" />
            </ModalContent>
            <ModalFooter>
                {showMultipleUserUploadButton ? (
                    <Button onClick={setBulkStep} disabled={submitting}>
                        {c('Action').t`Add multiple users`}
                    </Button>
                ) : (
                    <Button onClick={handleClose} disabled={submitting}>
                        {c('Action').t`Cancel`}
                    </Button>
                )}
                <Button loading={submitting} type="submit" color="norm">
                    {c('Action').t`Create user`}
                </Button>
            </ModalFooter>
        </Modal>
    );
};
export default SubUserCreateModal;
