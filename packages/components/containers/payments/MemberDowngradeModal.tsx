import { FormEvent, useState } from 'react';

import { c } from 'ttag';

import { Button, Card } from '@proton/atoms';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { hasFamily } from '@proton/shared/lib/helpers/subscription';
import { Organization } from '@proton/shared/lib/interfaces';

import { useSubscription } from '../..';
import {
    Form,
    InputFieldTwo,
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
    ModalProps,
    useFormErrors,
} from '../../components';

interface Props extends ModalProps {
    organization: Organization;
    onConfirm: () => void;
}

const MemberDowngradeModal = ({ organization, onConfirm, onClose, ...rest }: Props) => {
    const [subscription] = useSubscription();
    const { validator, onFormSubmit } = useFormErrors();
    const [confirmText, setConfirmText] = useState('');
    const organizationName = organization.Name;

    const modalTitle = hasFamily(subscription)
        ? c('familyOffer_2023:Title').t`Delete family group?`
        : c('familyOffer_2023:Title').t`Delete organization?`;
    const warningMessage = hasFamily(subscription)
        ? c('familyOffer_2023:Member downgrade modal')
              .t`This will remove all ${BRAND_NAME} premium features for every family member.`
        : c('familyOffer_2023:Member downgrade modal')
              .t`This will permanently delete all sub-users, accounts, and data associated with your organization.`;
    const label = hasFamily(subscription)
        ? c('familyOffer_2023:Label').t`Enter family group name to confirm`
        : c('familyOffer_2023:Label').t`Enter organization name to confirm`;
    const validatorError = hasFamily(subscription)
        ? c('familyOffer_2023:Error').t`Family group not recognized. Try again.`
        : c('familyOffer_2023:Error').t`Organization not recognized. Try again.`;

    return (
        <Modal
            as={Form}
            onSubmit={(event: FormEvent) => {
                event.preventDefault();
                if (!onFormSubmit()) {
                    return;
                }
                onConfirm();
                onClose?.();
            }}
            onClose={onClose}
            {...rest}
        >
            <ModalHeader title={modalTitle} />
            <ModalContent>
                <div className="mb-4">{warningMessage}</div>
                <Card rounded className="text-break user-select mb-4">
                    {organizationName}
                </Card>
                <InputFieldTwo
                    id="confirm-text"
                    bigger
                    label={label}
                    error={validator([
                        requiredValidator(confirmText),
                        confirmText !== organizationName ? validatorError : '',
                    ])}
                    autoFocus
                    value={confirmText}
                    onValue={setConfirmText}
                />
            </ModalContent>
            <ModalFooter>
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>
                <Button type="submit" color="danger" data-testid="confirm-member-delete">
                    {c('Action').t`Delete`}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default MemberDowngradeModal;
