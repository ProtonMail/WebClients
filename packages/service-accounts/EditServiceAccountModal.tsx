import { c } from 'ttag';

import type { ServiceAccount } from '@proton/shared/lib/interfaces/ServiceAccount';

import ServiceAccountForm, {
    type ServiceAccountFormSharedProps,
    type ServiceAccountFormValues,
} from './ServiceAccountForm';

interface Props extends ServiceAccountFormSharedProps {
    account: ServiceAccount;
    canEditName: boolean;
    onSave: (args: ServiceAccountFormValues & { account: ServiceAccount }) => Promise<void>;
}

const EditServiceAccountModal = ({ account, canEditName, onSave, ...rest }: Props) => (
    <ServiceAccountForm
        {...rest}
        title={c('Title').t`Edit service account`}
        subline={account.Name}
        submitLabel={c('Action').t`Save`}
        initialName={account.Name}
        initialManagers={account.Managers}
        ownName={account.Name}
        nameLocked={!canEditName}
        requireChanges
        onSubmit={(values) => onSave({ ...values, account })}
    />
);

export default EditServiceAccountModal;
