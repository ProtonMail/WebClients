import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import clsx from '@proton/utils/clsx';

interface Props {
    status: 'pending' | 'available';
}

const SessionRecoveryStatusTitle = ({ status }: Props) => {
    const [user] = useUser();

    const { statusText, backgroundClass } = (() => {
        if (status === 'pending') {
            return {
                statusText: c('session_recovery:status:info').t`Pending`,
                backgroundClass: 'bg-warning',
            };
        }

        return {
            statusText: c('session_recovery:status:info').t`Available`,
            backgroundClass: 'bg-primary',
        };
    })();

    return (
        <>
            <div className="flex flex-nowrap items-baseline">
                <h2 className="h3 text-bold mr-2">{c('session_recovery:status:title').t`Password reset request`}</h2>
                <span
                    className={clsx(
                        backgroundClass,
                        'shrink-0 text-uppercase text-sm text-semibold rounded-sm px-1 text-nowrap mt-1.5'
                    )}
                >
                    {statusText}
                </span>
            </div>
            <div className="color-weak" data-testid="session_recovery:user_email">
                {user.Email}
            </div>
        </>
    );
};

export default SessionRecoveryStatusTitle;
