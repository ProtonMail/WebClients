import { FormEvent, useMemo, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { useLoading } from '@proton/hooks';
import { editMemberInvitation, inviteMember } from '@proton/shared/lib/api/members';
import { GIGA, MAIL_APP_NAME, MEMBER_ROLE } from '@proton/shared/lib/constants';
import { emailValidator, requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { Member, Organization } from '@proton/shared/lib/interfaces';
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
import { useApi, useEventManager, useNotifications } from '../../hooks';
import MemberStorageSelector, { getStorageRange, getTotalStorage } from './MemberStorageSelector';

interface Props extends ModalStateProps {
    organization?: Organization;
    member: Member | null | undefined;
}

const UserInviteOrEditModal = ({ organization, member, ...modalState }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const [submitting, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const { validator, onFormSubmit } = useFormErrors();
    const totalStorage = getTotalStorage(member ?? {}, organization);
    const storageRange = getStorageRange(member ?? {}, organization);
    const storageSizeUnit = GIGA;
    const isEditing = !!member?.ID;

    const initialModel = useMemo(
        () => ({
            address: '',
            storage: member ? member.MaxSpace : clamp(500 * GIGA, storageRange.min, storageRange.max),
            vpn: !!member?.MaxVPN,
            admin: member?.Role === MEMBER_ROLE.ORGANIZATION_ADMIN,
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

    const sendInvitation = async () => {
        await api(inviteMember(model.address, model.storage));
        createNotification({ text: c('Success').t`Invitation sent` });
    };

    const editInvitation = async () => {
        let updated = false;
        await api(editMemberInvitation(member!.ID, model.storage));
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

    const mailFieldValidator = !isEditing ? [requiredValidator(model.address), emailValidator(model.address)] : [];
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

                <MemberStorageSelector
                    value={model.storage}
                    disabled={submitting}
                    sizeUnit={storageSizeUnit}
                    range={storageRange}
                    totalStorage={totalStorage}
                    onChange={handleChange('storage')}
                />
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
