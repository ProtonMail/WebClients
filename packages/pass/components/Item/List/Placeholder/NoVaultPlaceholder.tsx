import type { FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { selectOrganizationVaultCreationDisabled } from '@proton/pass/store/selectors';

import { ContactAdminWarning } from './ContactAdminWarning';

export const NoVaultPlaceholder: FC = () => {
    const vaultCreationDisabled = useSelector(selectOrganizationVaultCreationDisabled);

    return (
        <div className="flex flex-column text-center max-w-custom mb-10" style={{ '--max-w-custom': '28rem' }}>
            <strong className="text-semibold inline-block mb-4">{c('Title').t`You don't have any vaults`}</strong>
            {vaultCreationDisabled && <ContactAdminWarning />}
        </div>
    );
};
