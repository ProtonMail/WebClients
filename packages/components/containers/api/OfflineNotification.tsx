import { c } from 'ttag';

import UnderlineButton from '@proton/components/components/button/UnderlineButton';
import { useLoading } from '@proton/hooks';

interface Props {
    onRetry: () => Promise<void>;
    message?: string;
}
const OfflineNotification = ({ onRetry, message }: Props) => {
    const [loading, withLoading] = useLoading();
    const retryNow = (
        <UnderlineButton className="align-baseline p-0" disabled={loading} onClick={() => withLoading(onRetry())}>
            {c('Action').t`Retry now`}
        </UnderlineButton>
    );
    return (
        <>
            {message || c('Error').t`Servers are unreachable.`} {retryNow}
        </>
    );
};

export default OfflineNotification;
