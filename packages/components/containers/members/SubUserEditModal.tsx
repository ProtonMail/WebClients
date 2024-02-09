import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import {
    MemberKeyPayload,
    editMember,
    getMemberAddresses,
    getMemberKeyPayload,
    getPrivateAdminError,
} from '@proton/account';
import { Button, Card } from '@proton/atoms';
import { useLoading } from '@proton/hooks';
import { useDispatch } from '@proton/redux-shared-store';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { GIGA, MEMBER_PRIVATE, MEMBER_ROLE, MEMBER_SUBSCRIBER, NAME_PLACEHOLDER } from '@proton/shared/lib/constants';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { EnhancedMember } from '@proton/shared/lib/interfaces';
import { getIsPasswordless } from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';

import {
    Icon,
    Info,
    InputFieldTwo,
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
    ModalProps,
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
import MemberStorageSelector, { getStorageRange, getTotalStorage } from './MemberStorageSelector';
import { adminTooltipText } from './constants';

interface Props extends ModalProps<'form'> {
    member: EnhancedMember;
    allowStorageConfiguration?: boolean;
    allowVpnAccessConfiguration?: boolean;
    allowPrivateMemberConfiguration?: boolean;
    showAddressesSection?: boolean;
}

const SubUserEditModal = ({
    member,
    allowStorageConfiguration,
    allowVpnAccessConfiguration,
    allowPrivateMemberConfiguration,
    showAddressesSection,
    ...rest
}: Props) => {
    const [organization] = useOrganization();
    const [organizationKey] = useOrganizationKey();
    const dispatch = useDispatch();
    const storageSizeUnit = GIGA;
    const { call } = useEventManager();
    const verifyOutboundPublicKeys = useVerifyOutboundPublicKeys();
    const { validator, onFormSubmit } = useFormErrors();
    const [confirmDemotionModalProps, setConfirmDemotionModal, renderConfirmDemotion] = useModalState();
    const [confirmPromotionModalProps, setConfirmPromotionModal, renderConfirmPromotion] = useModalState();
    const memberKeyPacketPayload = useRef<MemberKeyPayload | null>(null);
    const passwordlessMode = getIsPasswordless(organizationKey?.Key);

    useEffect(() => {
        dispatch(getMemberAddresses({ member })).catch(noop);
    }, []);

    const initialModel = useMemo(
        () => ({
            name: member.Name,
            storage: member.MaxSpace,
            vpn: !!member.MaxVPN,
            private: !!member.Private,
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
    const canMakePrivate = member.Private === MEMBER_PRIVATE.READABLE;
    const canMakeAdmin = !member.Self && member.Role === MEMBER_ROLE.ORGANIZATION_MEMBER && !member.SSO;
    const canRevokeAdmin = !member.Self && member.Role === MEMBER_ROLE.ORGANIZATION_ADMIN;
    const errorHandler = useErrorHandler();

    const updatePartialModel = (partial: Partial<typeof model>) => {
        updateModel({ ...model, ...partial });
    };

    const handleSubmit = async ({ role }: { role: MEMBER_ROLE | null }) => {
        const result = await dispatch(
            editMember({
                member,
                memberDiff: {
                    name: initialModel.name !== model.name ? model.name : undefined,
                    storage: initialModel.storage !== model.storage ? model.storage : undefined,
                    vpn: hasVPN && initialModel.vpn !== model.vpn ? model.vpn : undefined,
                    private:
                        canMakePrivate && model.private && model.private !== initialModel.private ? true : undefined,
                    role: role !== null ? role : undefined,
                },
                memberKeyPacketPayload: memberKeyPacketPayload.current,
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
                                void withLoading(handleSubmit({ role: MEMBER_ROLE.ORGANIZATION_MEMBER })).catch(
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
                <Prompt
                    title={c('Title').t`Change role`}
                    buttons={[
                        <Button
                            color="norm"
                            loading={submitting}
                            onClick={() => {
                                confirmPromotionModalProps.onClose();
                                withLoading(handleSubmit({ role: MEMBER_ROLE.ORGANIZATION_ADMIN })).catch(errorHandler);
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

                        if (role === MEMBER_ROLE.ORGANIZATION_MEMBER) {
                            setConfirmDemotionModal(true);
                            return;
                        }

                        if (role === MEMBER_ROLE.ORGANIZATION_ADMIN && passwordlessMode) {
                            memberKeyPacketPayload.current = await getMemberKeyPayload({
                                organizationKey,
                                verifyOutboundPublicKeys,
                                api: silentApi,
                                member,
                                memberAddresses: await dispatch(getMemberAddresses({ member, retry: true })),
                            });

                            if (member.Private === MEMBER_PRIVATE.UNREADABLE) {
                                setConfirmPromotionModal(true);
                                return;
                            }
                        }

                        await handleSubmit({ role });
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

                    {allowVpnAccessConfiguration && hasVPN ? (
                        <div className="flex mb-5">
                            <label className="text-semibold mr-4" htmlFor="vpn-toggle">
                                {c('Label for new member').t`VPN connections`}
                            </label>
                            <Toggle
                                id="vpn-toggle"
                                checked={model.vpn}
                                onChange={({ target }) => updatePartialModel({ vpn: target.checked })}
                            />
                        </div>
                    ) : null}

                    {allowPrivateMemberConfiguration && canMakePrivate && (
                        <div className="flex mb-6">
                            <label className="text-semibold mr-4" htmlFor="private-toggle">
                                {c('Label for new member').t`Private`}
                            </label>
                            <Toggle
                                id="private-toggle"
                                checked={model.private}
                                onChange={({ target }) => updatePartialModel({ private: target.checked })}
                            />
                        </div>
                    )}
                    {(canMakeAdmin || canRevokeAdmin) && (
                        <div className="flex items-center mb-6">
                            <label className="text-semibold mr-1" htmlFor="admin-toggle">
                                {c('Label for new member').t`Admin`}
                            </label>
                            <Info className="mr-4" title={adminTooltipText} url={getKnowledgeBaseUrl('/user-roles')} />
                            <Toggle
                                id="admin-toggle"
                                checked={model.admin}
                                onChange={({ target }) => updatePartialModel({ admin: target.checked })}
                            />
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
