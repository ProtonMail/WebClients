import type { ReactNode } from 'react';

import { Icon, type IconName, Time } from '@proton/components';
import type { AuthDeviceOutput } from '@proton/shared/lib/keys/device';
import clsx from '@proton/utils/clsx';

const browsers: IconName[] = ['brand-brave', 'brand-safari', 'brand-brave', 'brand-chrome', 'brand-firefox'];

export const getAuthDevicePlatformIcon = (authDeviceOutput: AuthDeviceOutput): IconName | null => {
    const platform = authDeviceOutput?.Platform;
    if (!platform) {
        return null;
    }
    if (platform.includes('TV')) {
        return 'tv';
    }
    if (platform === 'iOS' || platform === 'Android') {
        return 'mobile';
    }
    if (platform === 'Web') {
        const name = authDeviceOutput.Name?.toLowerCase();
        const browser = browsers.find((browser) => name.includes(browser.replace('brand-', '')));
        if (browser) {
            return browser;
        }
        return 'globe';
    }
    return 'desktop';
};

export const getAuthDevicePlatformIconComponent = (iconName: IconName | null | undefined) => {
    if (!iconName) {
        return null;
    }
    return <Icon className="color-weak" name={iconName} size={5} />;
};

export const IconItem = ({
    icon,
    title,
    info,
    padding,
}: {
    icon: ReactNode;
    title: ReactNode;
    info: ReactNode;
    padding?: boolean;
}) => {
    return (
        <div className={clsx('flex flex-nowrap items-center gap-4', padding && 'px-4 py-2')}>
            <div className="shrink-0">{icon}</div>
            <div className="flex flex-column">
                <div className="text-bold">{title}</div>
                {info && <div className="color-weak">{info}</div>}
            </div>
        </div>
    );
};

const AuthDeviceItem = ({ authDevice, padding = true }: { authDevice: AuthDeviceOutput; padding?: boolean }) => {
    return (
        <IconItem
            padding={padding}
            icon={getAuthDevicePlatformIconComponent(getAuthDevicePlatformIcon(authDevice))}
            title={authDevice.Name}
            info={
                <>
                    {authDevice.LocalizedClientName} • <Time>{authDevice.LastActivityTime}</Time>
                </>
            }
        />
    );
};

export default AuthDeviceItem;
