import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { useLoading } from '@proton/hooks';

interface Props {
    onRetry: () => Promise<void>;
    message?: string;
}
const OfflineNotification = ({ onRetry, message }: Props) => {
    const [loading, withLoading] = useLoading();
    const retryNow = (
        <Button
            shape="underline"
            color="norm"
            className="align-baseline p-0"
            disabled={loading}
            onClick={() => withLoading(onRetry())}
        >
            {c('Action').t`Retry now`}
        </Button>
    );
    return (
        <>
            {message || c('Error').t`Servers are unreachable.`} {retryNow}
        </>
    );
};

export default OfflineNotification;
