import { c } from 'ttag';

import { ForkType, requestFork } from '@proton/shared/lib/authentication/fork';
import { APPS } from '@proton/shared/lib/constants';

export const GuestMeetingSchedulingBlocked = () => {
    const handleSignIn = () =>
        requestFork({
            fromApp: APPS.PROTONMEET,
            forkType: ForkType.LOGIN,
        });

    return (
        <div className="flex h-full w-full items-center justify-center text-semibold">
            <div className="text-semibold text-4xl">
                {c('l10n_nightly Info').t`Guest meeting creation is not allowed. Please `}
                <div className="inline-block color-primary text-underline cursor-pointer" onClick={handleSignIn}>
                    {c('l10n_nightly Action').t`sign in`}
                </div>
            </div>
        </div>
    );
};
