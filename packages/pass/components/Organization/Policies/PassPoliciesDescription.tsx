import type { FC } from 'react';

import { c } from 'ttag';

import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

export const PassPoliciesDescription: FC = () => (
    <SettingsParagraph>
        {c('Info').t`You can define the policies of ${PASS_APP_NAME} for the organization members.`}
    </SettingsParagraph>
);
