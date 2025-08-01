import type { FormEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import {
    type MemberPromptAction,
    editMember,
    getMemberAddresses,
    getMemberEditPayload,
    getPrivateAdminError,
    getPrivateText,
} from '@proton/account';
import { useOrganization } from '@proton/account/organization/hooks';
import { useOrganizationKey } from '@proton/account/organizationKey/hooks';
import { Button, Card } from '@proton/atoms';
import { Tooltip } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import useModalState, { type ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import Prompt from '@proton/components/components/prompt/Prompt';
import Toggle from '@proton/components/components/toggle/Toggle';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import AssistantUpdateSubscriptionButton from '@proton/components/containers/payments/subscription/assistant/AssistantUpdateSubscriptionButton';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import useApi from '@proton/components/hooks/useApi';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import { useDispatch } from '@proton/redux-shared-store';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import {
    BRAND_NAME,
    LUMO_APP_NAME,
    MEMBER_PRIVATE,
    MEMBER_ROLE,
    MEMBER_SUBSCRIBER,
    NAME_PLACEHOLDER,
} from '@proton/shared/lib/constants';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { hasOrganizationSetupWithKeys } from '@proton/shared/lib/helpers/organization';
import { sizeUnits } from '@proton/shared/lib/helpers/size';
import type { EnhancedMember, Member } from '@proton/shared/lib/interfaces';
import { getIsPasswordless } from '@proton/shared/lib/keys';
import { MemberUnprivatizationMode, getMemberUnprivatizationMode } from '@proton/shared/lib/keys/memberHelper';
import noop from '@proton/utils/noop';

import Addresses from '../addresses/Addresses';
import LumoUpdateSubscriptionButton from '../payments/subscription/lumo/LumoUpdateSubscriptionButton';
import MemberStorageSelector, { getStorageRange, getTotalStorage } from './MemberStorageSelector';
import MemberToggleContainer from './MemberToggleContainer';
import SubUserCreateHint from './SubUserCreateHint';
import { adminTooltipText } from './constants';
import { getPrivateLabel } from './helper';

interface Props extends ModalProps<'form'> {
    member: EnhancedMember;
    allowStorageConfiguration?: boolean;
    allowVpnAccessConfiguration?: boolean;
    allowPrivateMemberConfiguration?: boolean;
    allowAIAssistantConfiguration?: boolean;
    allowLumoConfiguration: boolean;
    showAddressesSection?: boolean;
    aiSeatsRemaining: boolean;
    lumoSeatsRemaining: boolean;
}

interface MemberState {
    name: string;
    storage: number;
    vpn: boolean;
    private: MEMBER_PRIVATE;
    ai: boolean;
    lumo: boolean;
    role: MEMBER_ROLE;
}

const getMemberDiff = ({
    model,
    initialModel,
}: {
    model: MemberState;
    initialModel: MemberState;
    hasVPN: boolean;
}): Partial<MemberState> => {
    return Object.fromEntries(
        Object.entries({
            name: initialModel.name !== model.name ? model.name : undefined,
            storage: initialModel.storage !== model.storage ? model.storage : undefined,
            // NOTE: These values are not included because they are updated immediately
            /*
        vpn: hasVPN && initialModel.vpn !== model.vpn ? model.vpn : undefined,
        numAI: initialModel.ai !== model.ai ? model.ai : undefined,
        private: model.private !== initialModel.private ? model.private : undefined,
        role: model.role !== initialModel.role ? model.role : undefined,
         */
        }).filter(([, value]) => {
            return value !== undefined;
        })
    );
};

const getMemberStateFromMember = (member: Member): MemberState => {
    return {
        name: member.Name,
        storage: member.MaxSpace,
        vpn: !!member.MaxVPN,
        private: member.Private,
        ai: !!member.NumAI,
        lumo: !!member.NumLumo,
        role: member.Role,
    };
};

const getMemberKeyPacketPayload = (memberAction: MemberPromptAction | null) => {
    return memberAction ? memberAction.payload : null;
};

const ConfirmAdminPromotionPrompt = ({
    memberPromptAction,
    onConfirm,
    ...confirmPromotionModalProps
}: {
    onConfirm: () => void;
    memberPromptAction: MemberPromptAction | null;
} & ModalStateProps) => {
    const memberKeyPacketPayload = getMemberKeyPacketPayload(memberPromptAction);
    if (!memberKeyPacketPayload) {
        return null;
    }
    const { member, email } = memberKeyPacketPayload;
    const name = member.Name;
    return (
        <Prompt
            title={c('Title').t`Change role`}
            buttons={[
                <Button
                    color="norm"
                    onClick={() => {
                        confirmPromotionModalProps.onClose();
                        onConfirm();
                    }}
                >{c('Action').t`Make admin`}</Button>,
                <Button
                    onClick={() => {
                        confirmPromotionModalProps.onClose();
                    }}
                >{c('Action').t`Cancel`}</Button>,
            ]}
            {...confirmPromotionModalProps}
        >
            <div className="mb-2">
                {c('Info').t`Are you sure you want to give administrative privileges to this user?`}
            </div>
            <Card rounded className="text-break">
                <div className="text-bold">{name}</div>
                {email !== name && <div>{email}</div>}
            </Card>
            {memberKeyPacketPayload.type === 'promote-global-sso' && (
                <div className="mt-2">
                    {c('unprivatization')
                        .t`To gain administrator rights, they will have to set a backup password the next time they sign in to ${BRAND_NAME}.`}
                </div>
            )}
        </Prompt>
    );
};

const SubUserEditModal = ({
    member,
    allowStorageConfiguration,
    allowVpnAccessConfiguration,
    allowPrivateMemberConfiguration,
    allowAIAssistantConfiguration,
    allowLumoConfiguration,
    showAddressesSection,
    aiSeatsRemaining,
    lumoSeatsRemaining,
    ...rest
}: Props) => {
    const [organization] = useOrganization();
    const [organizationKey] = useOrganizationKey();
    const dispatch = useDispatch();
    const storageSizeUnit = sizeUnits.GB;
    const { validator, onFormSubmit } = useFormErrors();
    const [confirmUnprivatizationProps, setConfirmUnprivatizationModal, renderConfirmUnprivatization] = useModalState();
    const [
        confirmRemoveUnprivatizationProps,
        setConfirmRemoveUnprivatizationModal,
        renderConfirmRemoveUnprivatization,
    ] = useModalState();
    const [confirmPrivatizationProps, setConfirmPrivatizationModal, renderConfirmPrivatization] = useModalState();
    const [confirmDemotionModalProps, setConfirmDemotionModal, renderConfirmDemotion] = useModalState();
    const [confirmPromotionModalProps, setConfirmPromotionModal, renderConfirmPromotion] = useModalState();
    const memberPromptActionRef = useRef<MemberPromptAction | null>(null);
    const passwordlessMode = getIsPasswordless(organizationKey?.Key);

    // We want to keep AI enabled if all seats are taken but the user already has a seat
    const disableAI = (!organization?.MaxAI || !aiSeatsRemaining) && !member.NumAI;
    const disableLumo = (!organization?.MaxLumo || !lumoSeatsRemaining) && !member.NumLumo;

    useEffect(() => {
        dispatch(getMemberAddresses({ member })).catch(noop);
    }, []);

    const initialModel = useMemo((): MemberState => {
        return getMemberStateFromMember(member);
    }, [member]);

    const [model, updateModel] = useState<MemberState>(initialModel);

    const [submitting, withLoading] = useLoading();
    const [loadingUnprivatization, withLoadingUnprivatization] = useLoading();
    const [loadingRole, withLoadingRole] = useLoading();
    const [loadingVPN, withLoadingVPN] = useLoading();
    const [loadingScribe, withLoadingScribe] = useLoading();
    const [loadingLumo, withLoadingLumo] = useLoading();
    const { createNotification } = useNotifications();
    const normalApi = useApi();
    const silentApi = getSilentApi(normalApi);

    const hasVPN = Boolean(organization?.MaxVPN);
    const unprivatization = getMemberUnprivatizationMode(member);

    const isSelf = Boolean(member.Self);

    const isSelfAndPrivate = Boolean(isSelf && member.Private === MEMBER_PRIVATE.UNREADABLE);

    const canTogglePrivate =
        // Organization must be keyful, so not family-style organization
        hasOrganizationSetupWithKeys(organization) &&
        // Not yourself, to avoid requesting unprivatization for yourself
        !isSelfAndPrivate &&
        // Cannot toggle private for SSO users
        !member.SSO &&
        // The user does not have an ongoing unprivatization request or an admin request is ongoing (to be able to remove it)
        (!unprivatization.exists || unprivatization.mode === MemberUnprivatizationMode.AdminAccess);

    const canPromoteAdmin =
        !isSelf &&
        member.Role === MEMBER_ROLE.ORGANIZATION_MEMBER &&
        unprivatization.mode !== MemberUnprivatizationMode.MagicLinkInvite;

    const canRevokeAdmin = !isSelf && member.Role === MEMBER_ROLE.ORGANIZATION_ADMIN;

    const errorHandler = useErrorHandler();

    const updatePartialModel = (partial: Partial<typeof model>) => {
        updateModel({ ...model, ...partial });
    };

    const handleUpdateMember = async (memberDiff: Parameters<typeof editMember>[0]['memberDiff']) => {
        const memberKeyPacketPayload = getMemberKeyPacketPayload(memberPromptActionRef.current);

        const result = await dispatch(
            editMember({
                member,
                memberDiff,
                memberKeyPacketPayload,
                api: silentApi,
            })
        );
        if (result.member) {
            const newValue = getMemberStateFromMember(result.member);
            const memberDiff = getMemberDiff({ model, initialModel, hasVPN });
            // Keep the partially updated member diff values if any
            updateModel({ ...newValue, ...memberDiff });
            createNotification({ text: c('Success').t`User updated` });
        }
        return result.diff;
    };

    const handleClose = submitting ? undefined : rest.onClose;

    const hasToggledPrivate = model.private === MEMBER_PRIVATE.UNREADABLE && !unprivatization.pending;
    const hasToggledAdmin = model.role === MEMBER_ROLE.ORGANIZATION_ADMIN || unprivatization.makeAdmin;
    const isPendingAdminAccess =
        unprivatization.pending && unprivatization.mode === MemberUnprivatizationMode.AdminAccess;

    return (
        <>
            {renderConfirmUnprivatization && (
                <Prompt
                    title={c('unprivatization').t`Request user permission for data access`}
                    buttons={[
                        <Button
                            color="norm"
                            loading={submitting}
                            onClick={() => {
                                confirmUnprivatizationProps.onClose();
                                void withLoadingUnprivatization(
                                    handleUpdateMember({ private: MEMBER_PRIVATE.READABLE })
                                ).catch(errorHandler);
                            }}
                        >{c('unprivatization').t`Send request`}</Button>,
                        <Button
                            onClick={() => {
                                confirmUnprivatizationProps.onClose();
                            }}
                        >{c('Action').t`Cancel`}</Button>,
                    ]}
                    {...confirmUnprivatizationProps}
                >
                    <div>
                        {c('unprivatization')
                            .t`To proceed, you'll need to request the user's permission to access their data or reset their password.`}
                        <br />
                        <br />

                        {c('unprivatization')
                            .t`Once the user consents, you will be able to help them regain account access or manage their data.`}
                    </div>
                </Prompt>
            )}
            {renderConfirmRemoveUnprivatization && (
                <Prompt
                    title={c('unprivatization').t`Cancel request to access user data?`}
                    buttons={[
                        <Button
                            color="danger"
                            loading={submitting}
                            onClick={() => {
                                confirmRemoveUnprivatizationProps.onClose();
                                void withLoadingUnprivatization(
                                    handleUpdateMember({ private: MEMBER_PRIVATE.UNREADABLE })
                                ).catch(errorHandler);
                            }}
                        >{c('unprivatization').t`Cancel request`}</Button>,
                        <Button
                            onClick={() => {
                                confirmRemoveUnprivatizationProps.onClose();
                            }}
                        >{c('unprivatization').t`Keep request`}</Button>,
                    ]}
                    {...confirmRemoveUnprivatizationProps}
                >
                    <div>
                        {c('unprivatization')
                            .t`This will cancel the pending request for administrator access to the user’s data or password reset.`}
                    </div>
                </Prompt>
            )}
            {renderConfirmPrivatization && (
                <Prompt
                    title={c('unprivatization').t`Revoke administrator access?`}
                    buttons={[
                        <Button
                            color="danger"
                            loading={submitting}
                            onClick={() => {
                                confirmPrivatizationProps.onClose();
                                void withLoadingUnprivatization(
                                    handleUpdateMember({ private: MEMBER_PRIVATE.UNREADABLE })
                                ).catch(errorHandler);
                            }}
                        >{c('unprivatization').t`Revoke access`}</Button>,
                        <Button
                            onClick={() => {
                                confirmPrivatizationProps.onClose();
                            }}
                        >{c('Action').t`Cancel`}</Button>,
                    ]}
                    {...confirmPrivatizationProps}
                >
                    <div>
                        {c('unprivatization')
                            .t`This will revoke the administrator permission to manage this user's account.`}
                        <br />
                        <br />

                        {c('unprivatization')
                            .t`By making the user private you won't be able to help them regain access to their data or account.`}
                    </div>
                </Prompt>
            )}
            {renderConfirmDemotion && (
                <Prompt
                    title={c('Title').t`Change role`}
                    buttons={[
                        <Button
                            color="danger"
                            loading={submitting}
                            onClick={() => {
                                confirmDemotionModalProps.onClose();
                                withLoadingRole(handleUpdateMember({ role: MEMBER_ROLE.ORGANIZATION_MEMBER })).catch(
                                    errorHandler
                                );
                            }}
                        >{c('Action').t`Remove`}</Button>,
                        <Button
                            onClick={() => {
                                confirmDemotionModalProps.onClose();
                            }}
                        >{c('Action').t`Cancel`}</Button>,
                    ]}
                    {...confirmDemotionModalProps}
                >
                    {member.Subscriber === MEMBER_SUBSCRIBER.PAYER
                        ? c('Info')
                              .t`This user is currently responsible for payments for your organization. By demoting this member, you will become responsible for payments for your organization.`
                        : c('Info').t`Are you sure you want to remove administrative privileges from this user?`}
                </Prompt>
            )}
            {renderConfirmPromotion && (
                <ConfirmAdminPromotionPrompt
                    onConfirm={() => {
                        withLoadingRole(handleUpdateMember({ role: MEMBER_ROLE.ORGANIZATION_ADMIN })).catch(
                            errorHandler
                        );
                    }}
                    memberPromptAction={memberPromptActionRef.current}
                    {...confirmPromotionModalProps}
                />
            )}
            <Modal
                as="form"
                size="large"
                {...rest}
                onSubmit={(event: FormEvent<HTMLFormElement>) => {
                    event.preventDefault();
                    event.stopPropagation();

                    if (!onFormSubmit(event.currentTarget)) {
                        return;
                    }

                    const handleSubmit = async () => {
                        const memberDiff = getMemberDiff({ model, initialModel, hasVPN });
                        await handleUpdateMember(memberDiff);
                        rest.onClose?.();
                    };

                    withLoading(handleSubmit()).catch(errorHandler);
                }}
                onClose={handleClose}
            >
                <ModalHeader title={c('Title').t`Edit user`} />
                <ModalContent>
                    <InputFieldTwo
                        id="name"
                        value={model.name}
                        error={validator([requiredValidator(model.name)])}
                        onValue={(value: string) => updatePartialModel({ name: value })}
                        label={c('Label').t`Name`}
                        placeholder={NAME_PLACEHOLDER}
                        autoFocus
                    />

                    <div className="flex flex-column gap-2 mb-4">
                        {allowPrivateMemberConfiguration && canTogglePrivate && (
                            <>
                                <MemberToggleContainer
                                    toggle={
                                        <Toggle
                                            disabled={isPendingAdminAccess}
                                            id="private-toggle"
                                            checked={hasToggledPrivate}
                                            loading={!isPendingAdminAccess && loadingUnprivatization}
                                            onChange={({ target }) => {
                                                if (hasToggledPrivate && !target.checked) {
                                                    setConfirmUnprivatizationModal(true);
                                                    return;
                                                }
                                                if (!hasToggledPrivate && target.checked && unprivatization.pending) {
                                                    setConfirmRemoveUnprivatizationModal(true);
                                                    return;
                                                }
                                                if (!hasToggledPrivate && target.checked) {
                                                    setConfirmPrivatizationModal(true);
                                                    return;
                                                }
                                            }}
                                        />
                                    }
                                    label={
                                        <label className="text-semibold" htmlFor="private-toggle">
                                            {getPrivateLabel()}
                                        </label>
                                    }
                                    assistiveText={getPrivateText()}
                                />
                                {isPendingAdminAccess && (
                                    <SubUserCreateHint className="bg-weak">
                                        <div className="flex-column md:flex-row flex gap-2">
                                            <div className="md:flex-1">
                                                {getBoldFormattedText(
                                                    c('unprivatization')
                                                        .t`**Pending admin access:** We sent a request to this user to allow any administrator to manage their account.`
                                                )}
                                            </div>
                                            <div className="md:shrink-0">
                                                <Button
                                                    loading={loadingUnprivatization}
                                                    size="small"
                                                    onClick={() => {
                                                        setConfirmRemoveUnprivatizationModal(true);
                                                    }}
                                                >
                                                    {c('unprivatization').t`Cancel request`}
                                                </Button>
                                            </div>
                                        </div>
                                    </SubUserCreateHint>
                                )}
                            </>
                        )}

                        {(canPromoteAdmin || canRevokeAdmin) && (
                            <MemberToggleContainer
                                toggle={
                                    <Toggle
                                        id="admin-toggle"
                                        loading={loadingRole}
                                        checked={hasToggledAdmin}
                                        onChange={({ target }) => {
                                            const run = async (memberDiff: { role: MEMBER_ROLE }) => {
                                                const result = await dispatch(
                                                    getMemberEditPayload({
                                                        member,
                                                        memberDiff,
                                                        api: silentApi,
                                                    })
                                                );

                                                memberPromptActionRef.current = result;

                                                if (result?.type === 'confirm-promote') {
                                                    if (result.prompt) {
                                                        setConfirmPromotionModal(true);
                                                        return;
                                                    }
                                                }

                                                if (result?.type === 'confirm-demote') {
                                                    setConfirmDemotionModal(true);
                                                    return;
                                                }

                                                await handleUpdateMember(memberDiff);
                                            };

                                            const newRole = target.checked
                                                ? MEMBER_ROLE.ORGANIZATION_ADMIN
                                                : MEMBER_ROLE.ORGANIZATION_MEMBER;

                                            withLoadingRole(run({ role: newRole })).catch(errorHandler);
                                        }}
                                    />
                                }
                                label={
                                    <label className="text-semibold" htmlFor="admin-toggle">
                                        {c('Label for new member').t`Admin`}
                                    </label>
                                }
                                assistiveText={
                                    <div>
                                        {adminTooltipText()}{' '}
                                        {passwordlessMode &&
                                            hasToggledPrivate &&
                                            hasToggledAdmin &&
                                            member.addressState === 'full' &&
                                            !member.Addresses?.[0]?.HasKeys && (
                                                <Tooltip title={getPrivateAdminError()} openDelay={0}>
                                                    <Icon className="color-danger ml-2" name="info-circle-filled" />
                                                </Tooltip>
                                            )}
                                    </div>
                                }
                            />
                        )}

                        {allowVpnAccessConfiguration && hasVPN ? (
                            <MemberToggleContainer
                                toggle={
                                    <Toggle
                                        id="vpn-toggle"
                                        checked={model.vpn}
                                        loading={loadingVPN}
                                        onChange={({ target }) => {
                                            withLoadingVPN(handleUpdateMember({ vpn: target.checked })).catch(
                                                errorHandler
                                            );
                                        }}
                                    />
                                }
                                label={
                                    <label className="text-semibold" htmlFor="vpn-toggle">
                                        {c('Label for new member').t`VPN connections`}
                                    </label>
                                }
                            />
                        ) : null}

                        {allowAIAssistantConfiguration && (
                            <MemberToggleContainer
                                toggle={
                                    <Toggle
                                        id="ai-assistant-toggle"
                                        checked={model.ai}
                                        loading={loadingScribe}
                                        disabled={disableAI}
                                        onChange={({ target }) => {
                                            withLoadingScribe(handleUpdateMember({ numAI: target.checked })).catch(
                                                errorHandler
                                            );
                                        }}
                                    />
                                }
                                label={
                                    <>
                                        <label className="text-semibold" htmlFor="ai-assistant-toggle">
                                            {c('Info').t`Writing assistant`}
                                        </label>
                                    </>
                                }
                                assistiveText={
                                    !aiSeatsRemaining && !model.ai ? <AssistantUpdateSubscriptionButton /> : undefined
                                }
                            />
                        )}

                        {allowLumoConfiguration && (
                            <MemberToggleContainer
                                toggle={
                                    <Toggle
                                        id="lumo-toggle"
                                        checked={model.lumo}
                                        loading={loadingLumo}
                                        disabled={disableLumo}
                                        onChange={({ target }) => {
                                            withLoadingLumo(handleUpdateMember({ lumo: target.checked })).catch(
                                                errorHandler
                                            );
                                        }}
                                    />
                                }
                                label={
                                    <>
                                        <label className="text-semibold" htmlFor="lumo-toggle">
                                            {LUMO_APP_NAME}
                                        </label>
                                    </>
                                }
                                assistiveText={
                                    !lumoSeatsRemaining && !model.lumo ? <LumoUpdateSubscriptionButton /> : undefined
                                }
                            />
                        )}
                    </div>

                    {allowStorageConfiguration && (
                        <MemberStorageSelector
                            className="mb-5"
                            value={model.storage}
                            sizeUnit={storageSizeUnit}
                            totalStorage={getTotalStorage(member, organization)}
                            range={getStorageRange(member, organization)}
                            onChange={(storage) => updatePartialModel({ storage })}
                        />
                    )}
                    {showAddressesSection && (
                        <div>
                            <h3 className="text-strong mb-2">{c('Label').t`Addresses`}</h3>
                            <div>
                                <Addresses organization={organization} memberID={member.ID} hasDescription={false} />
                            </div>
                        </div>
                    )}
                </ModalContent>
                <ModalFooter>
                    <div>{/* empty div to make it right aligned*/}</div>
                    <Button loading={submitting} type="submit" color="norm">
                        {c('Action').t`Save`}
                    </Button>
                </ModalFooter>
            </Modal>
        </>
    );
};

export default SubUserEditModal;
