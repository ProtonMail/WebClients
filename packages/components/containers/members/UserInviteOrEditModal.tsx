import { FormEvent, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { editMemberInvitation, inviteMember, updateQuota } from '@proton/shared/lib/api/members';
import { GIGA, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { emailValidator, requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { Domain, FAMILY_PLAN_INVITE_STATE, Member, Organization } from '@proton/shared/lib/interfaces';
import clamp from '@proton/utils/clamp';

import {
    InputFieldTwo,
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
    ModalStateProps,
    useFormErrors,
} from '../../components';
import { useApi, useEventManager, useLoading, useNotifications } from '../../hooks';
import Addresses from '../addresses/Addresses';
import MemberStorageSelector, { getStorageRange, getTotalStorage } from './MemberStorageSelector';

interface Props extends ModalStateProps {
    organization: Organization;
    domains: Domain[];
    member: Member | null;
}

const UserInviteOrEditModal = ({ organization, domains, member, ...modalState }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const [submitting, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const { validator, onFormSubmit } = useFormErrors();
    const totalStorage = getTotalStorage(member ?? {}, organization);
    const storageRange = getStorageRange(member ?? {}, organization);
    const storageSizeUnit = GIGA;

    const isEditing = !!member?.ID;
    const isInvitationPending = member?.State === FAMILY_PLAN_INVITE_STATE.STATUS_INVITED;

    const [model, setModel] = useState({
        address: '',
        storage: member ? member.MaxSpace : clamp(500 * GIGA, storageRange.min, storageRange.max),
    });

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
        await api(inviteMember(model.address, model.storage));
        createNotification({ text: c('Success').t`Invitation sent` });
    };

    const editInvitation = async () => {
        //Editing a pending invitation uses a different endpoint than updating a user that accepted the invite
        if (isInvitationPending) {
            await api(editMemberInvitation(member!.ID, model.storage));
        } else {
            await api(updateQuota(member!.ID, model.storage));
        }

        createNotification({ text: c('familyOffer_2023:Success').t`Member updated` });
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

    const mailFieldValidator = isEditing ? [requiredValidator(model.address), emailValidator(model.address)] : [];
    const modalTitle = isEditing
        ? c('familyOffer_2023:Title').t`Edit user storage`
        : c('familyOffer_2023:Title').t`Invite a user`;
    const modalDescription = isEditing
        ? c('familyOffer_2023:Info').t`You can increase or reduce the storage for this user.`
        : c('familyOffer_2023:Info')
              .t`If the user already has a ${MAIL_APP_NAME} address, enter it here. Otherwise they need to create an account first.`;

    return (
        <Modal
            as="form"
            size="large"
            {...modalState}
            onClose={handleClose}
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
                        required
                    />
                )}

                <MemberStorageSelector
                    value={model.storage}
                    disabled={submitting}
                    sizeUnit={storageSizeUnit}
                    range={storageRange}
                    totalStorage={totalStorage}
                    onChange={handleChange('storage')}
                />

                {isEditing && member.State === FAMILY_PLAN_INVITE_STATE.STATUS_ENABLED && (
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
                    {isEditing ? c('Action').t`Save` : c('Action').t`Invite`}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default UserInviteOrEditModal;
