import { FormEvent, useState } from 'react';
import { c } from 'ttag';
import { Organization } from '@proton/shared/lib/interfaces';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';

import {
    Button,
    Card,
    Form,
    InputFieldTwo,
    ModalProps,
    ModalTwo as Modal,
    ModalTwoHeader as ModalHeader,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    useFormErrors,
} from '../../components';

interface Props extends ModalProps {
    organization: Organization;
    onConfirm: () => void;
}

const MemberDowngradeModal = ({ organization, onConfirm, onClose, ...rest }: Props) => {
    const { validator, onFormSubmit } = useFormErrors();
    const [confirmText, setConfirmText] = useState('');
    const organizationName = organization.Name;

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
            <ModalHeader title={c('Title').t`Delete organization?`} />
            <ModalContent>
                <div className="mb1">
                    {c('Member downgrade modal')
                        .t`This will permanently delete all sub-users, accounts, and data associated with your organization.`}
                </div>
                <Card rounded className="text-break user-select mb1">
                    {organizationName}
                </Card>
                <InputFieldTwo
                    id="confirm-text"
                    bigger
                    label={c('Label').t`Enter organization name to confirm`}
                    error={validator([
                        requiredValidator(confirmText),
                        confirmText !== organizationName ? c('Error').t`Organization not recognized. Try again.` : '',
                    ])}
                    autoFocus
                    value={confirmText}
                    onValue={setConfirmText}
                />
            </ModalContent>
            <ModalFooter>
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>
                <Button type="submit" color="danger">
                    {c('Action').t`Delete`}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default MemberDowngradeModal;
