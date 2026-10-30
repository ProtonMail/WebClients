import { useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { isTauriOnMac } from '@proton/shared/lib/helpers/desktop';

import { useDeviceSettings } from '../../providers/DeviceSettingsProvider';
import { LumoIcon } from '../LumoIcon/LumoIcon';

import './NativeNotificationPermissionBanner.scss';

interface NativeNotificationPermissionBannerProps {
    className?: string;
    /** Whether users can dismiss this instance of the warning. */
    dismissible?: boolean;
}

export const NativeNotificationPermissionBanner = ({
    className,
    dismissible = false,
}: NativeNotificationPermissionBannerProps) => {
    const {
        notificationSettings: { permission, requestPermission, openSettings: openNotificationSettings },
    } = useDeviceSettings();
    const [dismissed, setDismissed] = useState(false);

    if (permission === undefined || permission === 'granted' || dismissed) return null;

    // macOS requires an initial permission prompt; Windows and Linux native notifications don't.
    const needsPermissionRequest = permission === 'not_determined' && isTauriOnMac;
    // translator: Button requesting operating system permission to show notifications.
    const enableNotificationsLabel = c('collider_2025:Action').t`Enable notifications`;
    // translator: Button opening the operating system settings for notifications.
    const openSettingsLabel = isTauriOnMac
        ? c('collider_2025:Action').t`Open System Settings`
        : c('collider_2025:Action').t`Open Settings`;

    return (
        <div
            className={clsx(
                'native-notification-permission-banner flex flex-nowrap items-center gap-3 p-3 pl-4 border border-weak rounded-lg text-sm',
                className
            )}
        >
            <LumoIcon aria-hidden name="BellOff" size={18} className="shrink-0" />
            <span className="flex-1 min-w-0 text-ellipsis-four-lines">
                <span className="text-semibold">
                    {
                        // translator: Warning that operating system notifications are disabled. ${LUMO_SHORT_APP_NAME} is the app name.
                        c('collider_2025:Info').t`Notifications are off for ${LUMO_SHORT_APP_NAME}. `
                    }
                </span>
                {
                    // translator: Explains why the user should allow notification permission when prompted by the operating system.
                    c('collider_2025:Info')
                        .t`Enable notifications to get notified when a task finishes or needs your attention.`
                }
            </span>

            <Button
                className="shrink-0 border border-weak"
                onClick={needsPermissionRequest ? requestPermission : openNotificationSettings}
                shape="ghost"
            >
                {needsPermissionRequest ? enableNotificationsLabel : openSettingsLabel}
            </Button>

            {dismissible && (
                <Button
                    icon
                    shape="ghost"
                    size="small"
                    className="shrink-0 color-weak"
                    onClick={() => setDismissed(true)}
                    title={
                        // translator: Dismiss button for the desktop notifications banner (imperative).
                        c('Action').t`Dismiss`
                    }
                >
                    <LumoIcon aria-hidden name="X" size={14} />
                </Button>
            )}
        </div>
    );
};
