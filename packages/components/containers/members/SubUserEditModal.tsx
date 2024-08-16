import type { FormEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import type { MemberKeyPayload } from '@proton/account';
import { editMember, getMemberAddresses, getMemberEditPayload, getPrivateAdminError } from '@proton/account';
import { Button, Card } from '@proton/atoms';
import { useLoading } from '@proton/hooks';
import { useDispatch } from '@proton/redux-shared-store';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { MEMBER_PRIVATE, MEMBER_ROLE, MEMBER_SUBSCRIBER, NAME_PLACEHOLDER } from '@proton/shared/lib/constants';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { sizeUnits } from '@proton/shared/lib/helpers/size';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { EnhancedMember } from '@proton/shared/lib/interfaces';
import { getIsPasswordless } from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';

import type { ModalProps } from '../../components';
import {
    Icon,
    Info,
    InputFieldTwo,
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
    Prompt,
    Toggle,
    Tooltip,
    useFormErrors,
    useModalState,
} from '../../components';
import {
    useApi,
    useErrorHandler,
    useEventManager,
    useNotifications,
    useOrganization,
    useOrganizationKey,
} from '../../hooks';
import Addresses from '../addresses/Addresses';
import useVerifyOutboundPublicKeys from '../keyTransparency/useVerifyOutboundPublicKeys';
import { AssistantUpdateSubscriptionButton } from '../payments';
import MemberStorageSelector, { getStorageRange, getTotalStorage } from './MemberStorageSelector';
import { adminTooltipText } from './constants';

interface Props extends ModalProps<'form'> {
    member: EnhancedMember;
    allowStorageConfiguration?: boolean;
    allowVpnAccessConfiguration?: boolean;
    allowPrivateMemberConfiguration?: boolean;
    allowAIAssistantConfiguration?: boolean;
    showAddressesSection?: boolean;
    aiSeatsRemaining: boolean;
}

const SubUserEditModal = ({
    member,
    allowStorageConfiguration,
    allowVpnAccessConfiguration,
    allowPrivateMemberConfiguration,
    allowAIAssistantConfiguration,
    showAddressesSection,
    aiSeatsRemaining,
    ...rest
}: Props) => {
    const [organization] = useOrganization();
    const [organizationKey] = useOrganizationKey();
    const dispatch = useDispatch();
    const storageSizeUnit = sizeUnits.GB;
    const { call } = useEventManager();
    const verifyOutboundPublicKeys = useVerifyOutboundPublicKeys();
    const { validator, onFormSubmit } = useFormErrors();
    const [confirmDemotionModalProps, setConfirmDemotionModal, renderConfirmDemotion] = useModalState();
    const [confirmPromotionModalProps, setConfirmPromotionModal, renderConfirmPromotion] = useModalState();
    const memberKeyPacketPayload = useRef<MemberKeyPayload | null>(null);
    const passwordlessMode = getIsPasswordless(organizationKey?.Key);

    // We want to keep AI enabled if all seats are taken but the user already has a seat
    const disableAI = !organization?.MaxAI || (!aiSeatsRemaining && !member.NumAI);

    useEffect(() => {
        dispatch(getMemberAddresses({ member })).catch(noop);
    }, []);

    const initialModel = useMemo(
        () => ({
            name: member.Name,
            storage: member.MaxSpace,
            vpn: !!member.MaxVPN,
            private: !!member.Private,
            ai: !!member.NumAI,
            admin: member.Role === MEMBER_ROLE.ORGANIZATION_ADMIN,
        }),
        [member]
    );

    const [model, updateModel] = useState(initialModel);

    const [submitting, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const normalApi = useApi();
    const silentApi = getSilentApi(normalApi);

    const hasVPN = Boolean(organization?.MaxVPN);
    const canMakePrivate = member.Private === MEMBER_PRIVATE.READABLE && !member.Unprivatization;
    const canMakeAdmin = !member.Self && member.Role === MEMBER_ROLE.ORGANIZATION_MEMBER && !member.SSO;
    const canRevokeAdmin = !member.Self && member.Role === MEMBER_ROLE.ORGANIZATION_ADMIN;
    const errorHandler = useErrorHandler();

    const updatePartialModel = (partial: Partial<typeof model>) => {
        updateModel({ ...model, ...partial });
    };

    const handleSubmit = async ({
        role,
        memberKeyPacketPayload,
    }: {
        role: MEMBER_ROLE | null;
        memberKeyPacketPayload: MemberKeyPayload | null;
    }) => {
        const result = await dispatch(
            editMember({
                member,
                memberDiff: {
                    name: initialModel.name !== model.name ? model.name : undefined,
                    storage: initialModel.storage !== model.storage ? model.storage : undefined,
                    vpn: hasVPN && initialModel.vpn !== model.vpn ? model.vpn : undefined,
                    numAI: initialModel.ai !== model.ai ? model.ai : undefined,
                    private:
                        canMakePrivate && model.private && model.private !== initialModel.private ? true : undefined,
                    role: role !== null ? role : undefined,
                },
                memberKeyPacketPayload,
                api: silentApi,
            })
        );
        if (result) {
            await call();
            createNotification({ text: c('Success').t`User updated` });
        }
        rest.onClose?.();
    };

    const handleClose = submitting ? undefined : rest.onClose;

    return (
        <>
            {renderConfirmDemotion && (
                <Prompt
                    title={c('Title').t`Change role`}
                    buttons={[
                        <Button
                            color="danger"
                            loading={submitting}
                            onClick={() => {
                                confirmDemotionModalProps.onClose();
                                void withLoading(
                                    handleSubmit({
                                        role: MEMBER_ROLE.ORGANIZATION_MEMBER,
                                        memberKeyPacketPayload: memberKeyPacketPayload.current,
                                    })
                                ).catch(errorHandler);
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
                <Prompt
                    title={c('Title').t`Change role`}
                    buttons={[
                        <Button
                            color="norm"
                            loading={submitting}
                            onClick={() => {
                                confirmPromotionModalProps.onClose();
                                withLoading(
                                    handleSubmit({
                                        role: MEMBER_ROLE.ORGANIZATION_ADMIN,
                                        memberKeyPacketPayload: memberKeyPacketPayload.current,
                                    })
                                ).catch(errorHandler);
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
                        {(() => {
                            if (!memberKeyPacketPayload.current) {
                                return '';
                            }
                            const { member, email } = memberKeyPacketPayload.current;
                            return (
                                <>
                                    <div className="text-bold">{member.Name}</div>
                                    <div>{email}</div>
                                </>
                            );
                        })()}
                    </Card>
                </Prompt>
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

                    let role: MEMBER_ROLE | null = (() => {
                        if (canRevokeAdmin && !model.admin && model.admin !== initialModel.admin) {
                            return MEMBER_ROLE.ORGANIZATION_MEMBER;
                        }
                        if (canMakeAdmin && model.admin && model.admin !== initialModel.admin) {
                            return MEMBER_ROLE.ORGANIZATION_ADMIN;
                        }
                        return null;
                    })();

                    const run = async () => {
                        memberKeyPacketPayload.current = null;
                        const { payload, action } = await dispatch(
                            getMemberEditPayload({
                                verifyOutboundPublicKeys,
                                role,
                                member,
                                api: silentApi,
                            })
                        );
                        memberKeyPacketPayload.current = payload;
                        if (action === 'confirm-demote') {
                            setConfirmDemotionModal(true);
                            return;
                        }
                        if (action === 'confirm-promote') {
                            setConfirmPromotionModal(true);
                            return;
                        }
                        await handleSubmit({ role, memberKeyPacketPayload: payload });
                    };

                    withLoading(run()).catch(errorHandler);
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

                    {allowVpnAccessConfiguration && hasVPN ? (
                        <div className="flex mb-6 items-center gap-2">
                            <Toggle
                                id="vpn-toggle"
                                checked={model.vpn}
                                onChange={({ target }) => updatePartialModel({ vpn: target.checked })}
                            />
                            <label className="text-semibold" htmlFor="vpn-toggle">
                                {c('Label for new member').t`VPN connections`}
                            </label>
                        </div>
                    ) : null}

                    {allowPrivateMemberConfiguration && canMakePrivate && (
                        <div className="flex mb-6 items-center gap-2">
                            <Toggle
                                id="private-toggle"
                                checked={model.private}
                                onChange={({ target }) => updatePartialModel({ private: target.checked })}
                            />
                            <label className="text-semibold" htmlFor="private-toggle">
                                {c('Label for new member').t`Private`}
                            </label>
                        </div>
                    )}

                    {(canMakeAdmin || canRevokeAdmin) && (
                        <div className="flex items-center mb-6 gap-2">
                            <Toggle
                                id="admin-toggle"
                                checked={model.admin}
                                onChange={({ target }) => updatePartialModel({ admin: target.checked })}
                            />
                            <label className="text-semibold mr-1" htmlFor="admin-toggle">
                                {c('Label for new member').t`Admin`}
                            </label>
                            <Info title={adminTooltipText()} url={getKnowledgeBaseUrl('/user-roles')} />
                            {passwordlessMode &&
                                model.private &&
                                model.admin &&
                                member.addressState === 'full' &&
                                !member.Addresses?.[0]?.HasKeys && (
                                    <Tooltip title={getPrivateAdminError()} openDelay={0}>
                                        <Icon className="color-danger ml-2" name="info-circle-filled" />
                                    </Tooltip>
                                )}
                        </div>
                    )}

                    {allowAIAssistantConfiguration && (
                        <div className="flex items-center gap-2 mb-6">
                            <Toggle
                                id="ai-assistant-toggle"
                                checked={model.ai}
                                disabled={disableAI}
                                onChange={({ target }) => updatePartialModel({ ai: target.checked })}
                            />
                            <label className="text-semibold" htmlFor="ai-assistant-toggle">
                                {c('Info').t`Writing assistant`}
                            </label>
                            {!aiSeatsRemaining && !model.ai && <AssistantUpdateSubscriptionButton />}
                        </div>
                    )}

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
                            <h3 className="text-strong">{c('Label').t`Addresses`}</h3>
                            <div>
                                <Addresses organization={organization} memberID={member.ID} />
                            </div>
                        </div>
                    )}
                </ModalContent>
                <ModalFooter>
                    <Button onClick={handleClose} disabled={submitting}>
                        {c('Action').t`Cancel`}
                    </Button>
                    <Button loading={submitting} type="submit" color="norm">
                        {c('Action').t`Save`}
                    </Button>
                </ModalFooter>
            </Modal>
        </>
    );
};

export default SubUserEditModal;
