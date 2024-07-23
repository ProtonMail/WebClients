import { c } from 'ttag';

import type { CustomNotificationProps } from '@proton/components';
import { NotificationButton, useNotifications, useUser } from '@proton/components';
import { Icon } from '@proton/components/components/icon';

import type { TipData } from 'proton-mail/models/tip';

import './TipBox.scss';

interface NotificationProps extends CustomNotificationProps {
    onSnooze: () => void;
}

const SnoozeTipsNotification = ({ onSnooze, onClose }: NotificationProps) => {
    return (
        <>
            <span>{c('Info').t`Another tip will be displayed next time you open Mail`}</span>
            <NotificationButton
                onClick={() => {
                    onSnooze();
                    onClose?.();
                }}
            >{c('Action').t`Snooze`}</NotificationButton>
        </>
    );
};

interface Props {
    data: TipData;
    isDismissed: boolean;
    setIsDismissed: (value: boolean) => void;
    updateLastSnoozeTime: (value: any) => void;
}

const TipBox = ({ data, updateLastSnoozeTime, isDismissed, setIsDismissed }: Props) => {
    const { createNotification } = useNotifications();
    const [user] = useUser();

    const onSnooze = () => {
        updateLastSnoozeTime(Date.now());
    };

    const onCancel = () => {
        setIsDismissed(true);
        createNotification({
            text: <SnoozeTipsNotification onSnooze={onSnooze} />,
            type: 'info',
            isClosing: true,
        });
    };

    if (isDismissed) {
        return null;
    }

    return (
        <div className="tip-box group-hover-opacity-container flex flex-none rounded border border-weak shadow-norm mx-4 mb-4 relative">
            <div className="tip-box-content flex flex-nowrap gap-4 m-4 items-start">
                <span
                    className="rounded p-2 inline-block flex shrink-0"
                    style={{
                        backgroundColor: 'var(--primary-minor-1)',
                    }}
                >
                    <Icon className="m-auto color-primary" size={5} name={data.icon} />
                </span>
                <div className="tip-box-text flex flex-nowrap flex-column gap-1">
                    <p className="m-0">{data.message}</p>
                    <span className="shrink-0">{data.cta}</span>
                </div>
            </div>
            {user.isPaid && (
                <button className="close-button absolute bg-norm z-up border border-weak shadow-norm rounded-full flex items-center justify-center group-hover:opacity-100">
                    <Icon className="color-hint" name="cross" size={4} onClick={onCancel} alt={c('Action').t`Close`} />
                </button>
            )}
        </div>
    );
};

export default TipBox;
