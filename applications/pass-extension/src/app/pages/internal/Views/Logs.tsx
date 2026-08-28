import type { FC } from 'react';

import { c } from 'ttag';

import { ApplicationLogs } from '@proton/pass/components/Settings/ApplicationLogs';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import { ExtensionHead } from '../../../../lib/components/Extension/ExtensionHead';

export const Logs: FC = () => (
    <div className="max-h-full max-w-full p-4">
        <ExtensionHead title={c('Title').t`${PASS_APP_NAME} Logs`} />
        <ApplicationLogs opened style={{ '--h-custom': 'max(calc(100vh - 130px), 18.75rem)' }} />
    </div>
);
