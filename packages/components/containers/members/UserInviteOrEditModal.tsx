import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';

import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { Button } from '@proton/atoms';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import Toggle from '@proton/components/components/toggle/Toggle';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import AssistantUpdateSubscriptionButton from '@proton/components/containers/payments/subscription/assistant/AssistantUpdateSubscriptionButton';
import useApi from '@proton/components/hooks/useApi';
import useEventManager from '@proton/components/hooks/useEventManager';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import { hasDuo, hasFamily, hasPassFamily, hasVisionary } from '@proton/payments';
import { editMemberInvitation, inviteMember, updateAI, updateLumo } from '@proton/shared/lib/api/members';
import { BRAND_NAME, LUMO_APP_NAME, MAIL_APP_NAME, MEMBER_ROLE } from '@proton/shared/lib/constants';
import { emailValidator, requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { sizeUnits } from '@proton/shared/lib/helpers/size';
import type { Member, Organization } from '@proton/shared/lib/interfaces';
import useFlag from '@proton/unleash/useFlag';
import clamp from '@proton/utils/clamp';

import LumoUpdateSubscriptionButton from '../payments/subscription/lumo/LumoUpdateSubscriptionButton';
import MemberStorageSelector, { getInitialStorage, getStorageRange, getTotalStorage } from './MemberStorageSelector';
import MemberToggleContainer from './MemberToggleContainer';

interface Props extends ModalStateProps {
    organization?: Organization;
    member: Member | null | undefined;
    allowAIAssistantConfiguration: boolean;
    allowAIAssistantUpdate: boolean;
    aiSeatsRemaining: boolean;
    lumoSeatsRemaining: boolean;
    allowStorageConfiguration?: boolean;
}

const UserInviteOrEditModal = ({
    organization,
    member,
    allowStorageConfiguration,
    allowAIAssistantConfiguration,
    allowAIAssistantUpdate,
    aiSeatsRemaining,
    lumoSeatsRemaining,
    ...modalState
}: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const [submitting, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const { validator, onFormSubmit } = useFormErrors();
    const totalStorage = getTotalStorage(member ?? {}, organization);
    const storageRange = getStorageRange(member ?? {}, organization);
    const storageSizeUnit = sizeUnits.GB;
    const isEditing = !!member?.ID;

    const lumoAddonAvailable = useFlag('LumoAddonAvailable');

    const [subscription] = useSubscription();
    const isVisionary = hasVisionary(subscription);
    const isDuo = hasDuo(subscription);
    const isFamily = hasFamily(subscription);

    const initialModel = useMemo(
        () => ({
            address: '',
            storage: member
                ? member.MaxSpace
                : clamp(getInitialStorage(organization, storageRange), storageRange.min, storageRange.max),
            vpn: !!member?.MaxVPN,
            numAI: aiSeatsRemaining && (isVisionary || isDuo || isFamily), // Visionary, Duo and Family users should have the toggle set to true by default
            lumo: member ? !!member.NumLumo : lumoSeatsRemaining && isVisionary, // Visionary users should have the toggle set to true by default
            admin: member?.Role === MEMBER_ROLE.ORGANIZATION_ADMIN,
        }),
        [member]
    );
    const [model, setModel] = useState(initialModel);

    const lumoHasChanged = model.lumo !== initialModel.lumo;

    const handleClose = () => {
        if (submitting) {
            return;
        }

        modalState.onClose();
    };

    const handleChange = (key: keyof typeof model) => (value: (typeof model)[typeof key]) => {
        setModel({ ...model, [key]: value });
    };

    const sendInvitation = async () => {
        const res = await api(
            inviteMember(model.address, model.storage, allowAIAssistantUpdate && model.numAI ? 1 : 0)
        );

        if (lumoAddonAvailable && lumoHasChanged) {
            await api(updateLumo(res.Member.ID, model.lumo ? 1 : 0));
        }

        createNotification({ text: c('Success').t`Invitation sent` });
    };

    const editInvitation = async () => {
        let updated = false;
        await api(editMemberInvitation(member!.ID, model.storage));

        if (allowAIAssistantUpdate) {
            await api(updateAI(member!.ID, model.numAI ? 1 : 0));
        }

        if (lumoAddonAvailable && lumoHasChanged) {
            await api(updateLumo(member!.ID, model.lumo ? 1 : 0));
        }

        updated = true;
        if (updated) {
            createNotification({ text: c('familyOffer_2023:Success').t`Member updated` });
        }
    };

    const handleSubmit = async () => {
        if (isEditing) {
            await editInvitation();
        } else {
            await sendInvitation();
        }
        await call();
        modalState.onClose();
    };

    const editingCreateAccountCopyFamily = c('familyOffer_2023:Info')
        .t`If the user already has a ${MAIL_APP_NAME} address, enter it here. Otherwise they need to create an account first.`;
    const editingCreateAccountCopyFamilyWithAccount = c('familyOffer_2023:Info')
        .t`If the user already has an account with ${BRAND_NAME}, enter it here. Otherwise they need to create an account first.`;

    const editingCreateAccountCopy =
        hasPassFamily(subscription) || hasVisionary(subscription)
            ? editingCreateAccountCopyFamilyWithAccount
            : editingCreateAccountCopyFamily;

    const mailFieldValidator = !isEditing ? [requiredValidator(model.address), emailValidator(model.address)] : [];
    const modalTitle = isEditing
        ? c('familyOffer_2023:Title').t`Edit user storage`
        : c('familyOffer_2023:Title').t`Invite a user`;
    const modalDescription = isEditing
        ? c('familyOffer_2023:Info').t`You can increase or reduce the storage for this user.`
        : editingCreateAccountCopy;

    return (
        <Modal
            as="form"
            size="large"
            {...modalState}
            onClose={handleClose}
            noValidate
            onSubmit={(event: FormEvent) => {
                event.preventDefault();
                event.stopPropagation();
                if (!onFormSubmit()) {
                    return;
                }
                void withLoading(handleSubmit());
            }}
        >
            <ModalHeader title={modalTitle} />
            <ModalContent>
                <p className="color-weak">{modalDescription}</p>

                {!isEditing && (
                    <InputFieldTwo
                        id="email-address"
                        type="email"
                        autoCapitalize="off"
                        autoComplete="off"
                        autoCorrect="off"
                        value={model.address}
                        error={validator(mailFieldValidator)}
                        onValue={handleChange('address')}
                        label={c('Label').t`Email address`}
                        placeholder="thomas.anderson@proton.me"
                        disableChange={submitting}
                        autoFocus
                    />
                )}

                {allowAIAssistantConfiguration && (
                    <div className="mb-4">
                        <MemberToggleContainer
                            toggle={
                                <Toggle
                                    id="ai-assistant-toggle"
                                    checked={model.numAI}
                                    disabled={!aiSeatsRemaining}
                                    onChange={({ target }) => handleChange('numAI')(target.checked)}
                                />
                            }
                            label={
                                <label className="text-semibold" htmlFor="ai-assistant-toggle">
                                    {c('Info').t`Writing assistant`}
                                </label>
                            }
                            assistiveText={
                                !aiSeatsRemaining && !model.numAI ? <AssistantUpdateSubscriptionButton /> : undefined
                            }
                        />
                    </div>
                )}

                {lumoAddonAvailable && (
                    <div className="mb-4">
                        <MemberToggleContainer
                            toggle={
                                <Toggle
                                    id="lumo-toggle"
                                    checked={model.lumo}
                                    disabled={!lumoSeatsRemaining}
                                    onChange={({ target }) => handleChange('lumo')(target.checked)}
                                />
                            }
                            label={
                                <label className="text-semibold" htmlFor="lumo-toggle">
                                    {LUMO_APP_NAME}
                                </label>
                            }
                            assistiveText={
                                !lumoSeatsRemaining && !model.lumo ? <LumoUpdateSubscriptionButton /> : undefined
                            }
                        />
                    </div>
                )}

                {allowStorageConfiguration && (
                    <MemberStorageSelector
                        value={model.storage}
                        disabled={submitting}
                        sizeUnit={storageSizeUnit}
                        range={storageRange}
                        totalStorage={totalStorage}
                        onChange={handleChange('storage')}
                    />
                )}
            </ModalContent>
            <ModalFooter>
                <Button onClick={handleClose} disabled={submitting}>
                    {c('Action').t`Cancel`}
                </Button>
                <Button loading={submitting} type="submit" color="norm">
                    {isEditing ? c('Action').t`Save` : c('Action').t`Invite`}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default UserInviteOrEditModal;
