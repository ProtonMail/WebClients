import type { FC } from 'react';

import { c } from 'ttag';

import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import type { OrganizationGetResponse, OrganizationUpdatePasswordPolicyInput } from '../../../types/api/pass';
import type { Maybe } from '../../../types/utils';
import { PasswordGeneratorPolicyForm } from './PasswordGeneratorPolicyForm';

type Props = {
    /** The form only renders once the settings are loaded. */
    organizationSettings: Maybe<OrganizationGetResponse>;
    loading: boolean;
    onSubmit: (config: OrganizationUpdatePasswordPolicyInput) => Promise<void>;
};

export const PassPasswordGeneratorPolicy: FC<Props> = ({ organizationSettings, loading, onSubmit }) => (
    <>
        <div className="color-weak mb-4">
            {c('Description')
                .t`You can enforce the password rules that organization members will use when they generate a password in ${PASS_APP_NAME}.`}
        </div>
        {organizationSettings && (
            <PasswordGeneratorPolicyForm
                config={organizationSettings.Settings?.PasswordPolicy ?? null}
                onSubmit={onSubmit}
                loading={loading}
            />
        )}
    </>
);
