import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { useCalendarUserSettings } from '@proton/calendar/calendarUserSettings/hooks';
import Checkbox from '@proton/components/components/input/Checkbox';
import Prompt from '@proton/components/components/prompt/Prompt';
import useApi from '@proton/components/hooks/useApi';
import useEventManager from '@proton/components/hooks/useEventManager';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import { updateCalendarUserSettings } from '@proton/shared/lib/api/calendars';

interface Props {
    localTzid: string;
    onClose?: () => void;
    isOpen: boolean;
}

const AskUpdateTimezoneModal = ({ localTzid, onClose, isOpen }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [calendarUserSettings] = useCalendarUserSettings();

    const [updating, withUpdating] = useLoading();
    const [cancelling, withCancelling] = useLoading();

    const [autoDetectPrimaryTimezone, setAutoDetectPrimaryTimezone] = useState<boolean>(
        !!calendarUserSettings?.AutoDetectPrimaryTimezone
    );

    const handleUpdateTimezone = async () => {
        await api(
            updateCalendarUserSettings({
                PrimaryTimezone: localTzid,
                AutoDetectPrimaryTimezone: +autoDetectPrimaryTimezone,
            })
        );
        await call();
        onClose?.();
        createNotification({ text: c('Success').t`Preference saved` });
    };

    const handleCancel = async () => {
        if (autoDetectPrimaryTimezone !== !!calendarUserSettings?.AutoDetectPrimaryTimezone) {
            await api(
                updateCalendarUserSettings({
                    AutoDetectPrimaryTimezone: +autoDetectPrimaryTimezone,
                })
            );
            await call();
            createNotification({ text: c('Success').t`Preference saved` });
        }

        onClose?.();
    };

    const timezone = <b key={0}>{localTzid}</b>;

    return (
        <Prompt
            open={isOpen}
            onClose={onClose}
            title={c('Modal title').t`Time zone changed`}
            buttons={[
                <Button
                    loading={updating}
                    onClick={() => {
                        void withUpdating(handleUpdateTimezone());
                    }}
                    color="norm"
                >
                    {c('Action').t`Update`}
                </Button>,
                <Button
                    loading={cancelling}
                    onClick={() => {
                        void withCancelling(handleCancel());
                    }}
                >
                    {c('Action').t`Keep current time zone`}
                </Button>,
            ]}
            actions={
                <Checkbox
                    id="autodetect-primary-timezone"
                    autoFocus
                    checked={!autoDetectPrimaryTimezone}
                    disabled={updating}
                    onChange={() => setAutoDetectPrimaryTimezone(!autoDetectPrimaryTimezone)}
                >
                    {c("Don't ask to update timezone checkbox label").t`Don't ask again`}
                </Checkbox>
            }
        >
            <p>
                {c('Info')
                    .jt`Your system time zone seems to have changed to ${timezone}. Do you want to update your time zone preference?`}
            </p>
        </Prompt>
    );
};

export default AskUpdateTimezoneModal;
