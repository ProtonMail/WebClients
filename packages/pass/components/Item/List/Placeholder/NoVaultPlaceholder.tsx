import type { FC } from 'react';

import { c } from 'ttag';

import { ContactAdminWarning } from './ContactAdminWarning';

export const NoVaultPlaceholder: FC = () => {
    return (
        <div className="flex flex-column text-center max-w-custom mb-10" style={{ '--max-w-custom': '28rem' }}>
            <strong className="h4 text-semibold inline-block mb-4">{c('Title').t`You don't have any vault`}</strong>
            <ContactAdminWarning />
        </div>
    );
};
