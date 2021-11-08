import { FormEvent, useState } from 'react';
import { c } from 'ttag';
import { Organization } from '@proton/shared/lib/interfaces';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';

import { Card, ErrorButton, FormModal, InputFieldTwo, useFormErrors } from '../../components';

interface Props {
    organization: Organization;
    onConfirm: () => void;
    onClose?: () => void;
}

const MemberDowngradeModal = ({ organization, onConfirm, ...rest }: Props) => {
    const { validator, onFormSubmit } = useFormErrors();
    const [confirmText, setConfirmText] = useState('');
    const organizationName = organization.Name;
    return (
        <FormModal
            small
            title={c('Title').t`Delete organization?`}
            close={c('Action').t`Cancel`}
            submit={<ErrorButton type="submit">{c('Action').t`Delete`}</ErrorButton>}
            onSubmit={(event: FormEvent) => {
                event.preventDefault();
                if (!onFormSubmit()) {
                    return;
                }
                onConfirm();
                rest.onClose?.();
            }}
            {...rest}
        >
            <div className="mb1">{c('Member downgrade modal')
                .t`This will permanently delete all sub-users, accounts, and data associated with your organization.`}</div>
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
        </FormModal>
    );
};

export default MemberDowngradeModal;
