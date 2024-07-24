import { type FC } from 'react';

import { c } from 'ttag';

import { PasswordUnlockProvider } from '@proton/pass/components/Lock/PasswordUnlockProvider';
import { PinUnlockProvider } from '@proton/pass/components/Lock/PinUnlockProvider';
import { OrganizationProvider } from '@proton/pass/components/Organization/OrganizationProvider';
import { LockSetup } from '@proton/pass/components/Settings/LockSetup';
import { AppStatus } from '@proton/pass/types';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

type Props = {
    setAppStatus: (status: AppStatus) => void;
};
export const LockOnboarding: FC<Props> = ({ setAppStatus }) => {
    return (
        <OrganizationProvider>
            <PasswordUnlockProvider>
                <PinUnlockProvider>
                    <div className="text-semibold mb-4">{c('Info')
                        .t`Your organization requires you to secure your access to ${PASS_APP_NAME}`}</div>
                    <LockSetup onSuccess={() => setAppStatus(AppStatus.READY)} />
                </PinUnlockProvider>
            </PasswordUnlockProvider>
        </OrganizationProvider>
    );
};
