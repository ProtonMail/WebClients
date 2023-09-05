import { c } from 'ttag';

import { useUser } from '@proton/components/hooks';
import clsx from '@proton/utils/clsx';

interface Props {
    status: 'pending' | 'available';
}

const SessionRecoveryStatusTitle = ({ status }: Props) => {
    const [user] = useUser();

    const { statusText, backgroundClass } = (() => {
        if (status === 'pending') {
            return {
                statusText: c('Info').t`Pending`,
                backgroundClass: 'bg-warning',
            };
        }

        return {
            statusText: c('Info').t`Available`,
            backgroundClass: 'bg-primary',
        };
    })();

    return (
        <>
            <div className="flex flex-nowrap flex-align-items-baseline">
                <h2 className="h3 text-bold mr-2">{c('Title').t`Password reset request`}</h2>
                <span
                    className={clsx(
                        backgroundClass,
                        'flex-item-noshrink text-uppercase text-sm text-semibold rounded-sm px-1 text-nowrap mt-1.5'
                    )}
                >
                    {statusText}
                </span>
            </div>
            <div className="color-weak">{user.Email}</div>
        </>
    );
};

export default SessionRecoveryStatusTitle;
