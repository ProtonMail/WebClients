import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';

import { c } from 'ttag';

import { createInvite, editInvite } from '@proton/account/members/actions';
import { getInitialStorage, getStorageRange, getTotalStorage } from '@proton/account/organization/storage';
import { useSubscription } from '@proton/account/subscription/hooks';
import { Button } from '@proton/atoms/Button/Button';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import Toggle from '@proton/components/components/toggle/Toggle';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import { disableStorageSelection } from '@proton/components/containers/members/helper';
import AssistantUpdateSubscriptionButton from '@proton/components/containers/payments/subscription/assistant/AssistantUpdateSubscriptionButton';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import { type Subscription, hasDuo, hasFamily, hasPassFamily, hasVisionary } from '@proton/payments';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { BRAND_NAME, LUMO_APP_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { emailValidator, requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { sizeUnits } from '@proton/shared/lib/helpers/size';
import type { Member, Organization } from '@proton/shared/lib/interfaces';
import clamp from '@proton/utils/clamp';

import LumoUpdateSubscriptionButton from '../payments/subscription/lumo/LumoUpdateSubscriptionButton';
import MemberStorageSelector from './MemberStorageSelector';
import MemberToggleContainer from './MemberToggleContainer';

interface Props extends ModalStateProps {
    organization?: Organization;
    member: Member | null | undefined;
    allowAIAssistantConfiguration: boolean;
    allowAIAssistantUpdate: boolean;
    aiSeatsRemaining: boolean;
    allowLumoConfiguration: boolean;
    allowLumoUpdate: boolean;
    lumoSeatsRemaining: boolean;
    allowStorageConfiguration?: boolean;
}

interface MemberState {
    email: string;
    storage: number;
    numAI: boolean;
    lumo: boolean;
}

const getMemberState = ({
    member,
    organization,
    subscription,
    storageRange,
    aiSeatsRemaining,
    lumoSeatsRemaining,
}: {
    member: Member | null | undefined;
    organization: Organization | undefined;
    subscription: Subscription | undefined;
    storageRange: { min: number; max: number };
    aiSeatsRemaining: boolean;
    lumoSeatsRemaining: boolean;
}): MemberState => {
    const isVisionary = hasVisionary(subscription);
    const isDuo = hasDuo(subscription);
    const isFamily = hasFamily(subscription);

    return {
        email: '',
        storage: member
            ? member.MaxSpace
            : clamp(getInitialStorage(organization, storageRange), storageRange.min, storageRange.max),
        numAI: aiSeatsRemaining && (isVisionary || isDuo || isFamily), // Visionary, Duo and Family users should have the toggle set to true by default
        lumo: member ? !!member.NumLumo : lumoSeatsRemaining && isVisionary, // Visionary users should have the toggle set to true by default
    };
};

const getMemberDiff = ({
    model,
    initialModel,
}: {
    model: MemberState;
    initialModel: MemberState;
}): Partial<MemberState> => {
    return Object.fromEntries(
        Object.entries(model).filter(([key, value]) => {
            return initialModel[key as keyof typeof initialModel] !== value;
        })
    );
};

const UserInviteOrEditModal = ({
    organization,
    member,
    allowStorageConfiguration,
    allowAIAssistantConfiguration,
    allowAIAssistantUpdate,
    aiSeatsRemaining,
    allowLumoConfiguration,
    allowLumoUpdate,
    lumoSeatsRemaining,
    ...modalState
}: Props) => {
    const dispatch = useDispatch();
    const [submitting, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const { validator, onFormSubmit } = useFormErrors();
    const totalStorage = getTotalStorage(member ?? {}, organization);
    const storageRange = getStorageRange(member ?? {}, organization);
    const storageSizeUnit = sizeUnits.GB;
    const isEditing = !!member?.ID;

    const [subscription] = useSubscription();

    const initialModel = useMemo(
        () =>
            getMemberState({
                member,
                subscription,
                organization,
                storageRange,
                aiSeatsRemaining,
                lumoSeatsRemaining,
            }),
        [member]
    );
    const [model, setModel] = useState(initialModel);

    const handleClose = () => {
        if (submitting) {
            return;
        }
        modalState.onClose();
    };

    const handleChange = (key: keyof typeof model) => (value: (typeof model)[typeof key]) => {
        setModel({ ...model, [key]: value });
    };

    const filterModel = <T extends Partial<MemberState>>(model: T) => {
        return {
            ...model,
            numAI: !allowAIAssistantUpdate ? undefined : model.numAI,
            lumo: !allowLumoUpdate ? undefined : model.lumo,
        };
    };

    const sendInvitation = async () => {
        await dispatch(createInvite(filterModel(model)));
        createNotification({ text: c('Success').t`Invitation sent` });
    };

    const editInvitation = async () => {
        if (!member) {
            throw new Error('Member is not defined');
        }
        const memberDiff = filterModel(getMemberDiff({ model, initialModel }));
        const result = await dispatch(editInvite({ member, memberDiff }));
        if (result.diff) {
            createNotification({ text: c('familyOffer_2023:Success').t`Member updated` });
        }
    };

    const handleSubmit = async () => {
        if (isEditing) {
            await editInvitation();
        } else {
            await sendInvitation();
        }
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

    const mailFieldValidator = !isEditing ? [requiredValidator(model.email), emailValidator(model.email)] : [];
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
                        value={model.email}
                        error={validator(mailFieldValidator)}
                        onValue={handleChange('email')}
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

                {allowLumoConfiguration && (
                    <div className="mb-4">
                        <MemberToggleContainer
                            toggle={
                                <Toggle
                                    id="lumo-toggle"
                                    checked={model.lumo}
                                    disabled={!model.lumo && !lumoSeatsRemaining}
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
                        disabled={submitting || disableStorageSelection(organization)}
                        sizeUnit={storageSizeUnit}
                        range={storageRange}
                        totalStorage={totalStorage}
                        onChange={handleChange('storage')}
                        validator={validator}
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
