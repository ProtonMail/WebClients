import type { FC } from 'react';

import { ExtensionHead } from 'proton-pass-extension/lib/components/Extension/ExtensionHead';
import { c } from 'ttag';

import { ApplicationLogs } from '@proton/pass/components/Settings/ApplicationLogs';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

export const Logs: FC = () => (
    <div className="max-h-full max-w-full p-4">
        <ExtensionHead title={c('Title').t`${PASS_APP_NAME} Logs`} />
        <ApplicationLogs opened style={{ '--h-custom': 'max(calc(100vh - 130px), 18.75rem)' }} />
    </div>
);
