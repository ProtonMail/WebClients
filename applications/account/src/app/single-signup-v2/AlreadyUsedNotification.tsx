import { c } from 'ttag';

import NotificationButton from '@proton/components/containers/notifications/NotificationButton';

const AlreadyUsedNotification = ({ onClick, onClose }: { onClick: () => void; onClose?: () => void }) => {
    return (
        <>
            {c('Info').t`Email address already used`}
            <NotificationButton
                onClick={() => {
                    onClick?.();
                    onClose?.();
                }}
            >{c('Action').t`Sign in`}</NotificationButton>
        </>
    );
};

export default AlreadyUsedNotification;
