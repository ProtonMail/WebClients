import { c } from 'ttag';
import { Button, useApi, useEventManager, useNotifications, AlertModal, useLoading } from '@proton/components';
import { updateCalendarUserSettings } from '@proton/shared/lib/api/calendars';

interface Props {
    localTzid: string;
    onClose?: () => void;
    isOpen: boolean;
}

const AskUpdateTimezoneModal = ({ localTzid, onClose, isOpen }: Props) => {
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();

    const handleUpdateTimezone = async (tzid: string) => {
        await api(updateCalendarUserSettings({ PrimaryTimezone: tzid }));
        await call();
        onClose?.();
        createNotification({ text: c('Success').t`Preference saved` });
    };

    const timezone = <b key={0}>{localTzid}</b>;

    const handleClose = () => {
        onClose?.();
    };

    const handleSubmit = () => {
        withLoading(handleUpdateTimezone(localTzid));
    };

    return (
        <AlertModal
            open={isOpen}
            onClose={handleClose}
            onSubmit={handleSubmit}
            title={c('Modal title').t`Time zone changed`}
            buttons={[
                <Button loading={loading} color="norm" onClick={handleSubmit}>{c('Action').t`Update`}</Button>,
                <Button onClick={handleClose} autoFocus>{c('Action').t`Cancel`}</Button>,
            ]}
        >
            {c('Info')
                .jt`Your system time zone seems to have changed to ${timezone}. Do you want to update your time zone preference?`}
        </AlertModal>
    );
};

export default AskUpdateTimezoneModal;
