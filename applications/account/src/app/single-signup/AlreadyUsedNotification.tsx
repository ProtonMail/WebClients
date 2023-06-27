import { Link } from 'react-router-dom';

import { c } from 'ttag';

import NotificationButton from '@proton/components/containers/notifications/NotificationButton';

import { OnUpdate } from './interface';

const AlreadyUsedNotification = ({
    onUpdate,
    to,
    onClose,
}: {
    onUpdate: OnUpdate;
    to: Parameters<Link>[0]['to'];
    onClose?: () => void;
}) => {
    return (
        <>
            {c('Info').t`Email address already used`}
            <NotificationButton
                as={Link}
                to={to}
                onClick={() => {
                    onUpdate({ create: 'login-notification' });
                    onClose?.();
                }}
            >{c('Action').t`Sign in`}</NotificationButton>
        </>
    );
};

export default AlreadyUsedNotification;
