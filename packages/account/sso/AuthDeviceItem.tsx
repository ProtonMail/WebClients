import type { ReactNode } from 'react';

import Time from '@proton/components/components/time/Time';
import type { IconComponent } from '@proton/icons/component';
import { IcBrandBrave } from '@proton/icons/icons/IcBrandBrave';
import { IcBrandChrome } from '@proton/icons/icons/IcBrandChrome';
import { IcBrandFirefox } from '@proton/icons/icons/IcBrandFirefox';
import { IcBrandSafari } from '@proton/icons/icons/IcBrandSafari';
import { IcDesktop } from '@proton/icons/icons/IcDesktop';
import { IcGlobe } from '@proton/icons/icons/IcGlobe';
import { IcMobile } from '@proton/icons/icons/IcMobile';
import { IcTv } from '@proton/icons/icons/IcTv';
import type { AuthDeviceOutput } from '@proton/shared/lib/keys/device';
import clsx from '@proton/utils/clsx';

/** Matched against the lowercased device name, first match wins. */
const browsers: { match: string; Icon: IconComponent }[] = [
    { match: 'brave', Icon: IcBrandBrave },
    { match: 'safari', Icon: IcBrandSafari },
    { match: 'chrome', Icon: IcBrandChrome },
    { match: 'firefox', Icon: IcBrandFirefox },
];

export const getAuthDevicePlatformIcon = (authDeviceOutput: AuthDeviceOutput): IconComponent | null => {
    const platform = authDeviceOutput?.Platform;
    if (!platform) {
        return null;
    }
    if (platform.includes('TV')) {
        return IcTv;
    }
    if (platform === 'iOS' || platform === 'Android') {
        return IcMobile;
    }
    if (platform === 'Web') {
        const name = authDeviceOutput.Name?.toLowerCase();
        const browser = browsers.find(({ match }) => name.includes(match));
        if (browser) {
            return browser.Icon;
        }
        return IcGlobe;
    }
    return IcDesktop;
};

export const getAuthDevicePlatformIconComponent = (Icon: IconComponent | null | undefined) => {
    if (!Icon) {
        return null;
    }
    return <Icon className="color-weak" size={5} />;
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
                <div className="text-bold text-break">{title}</div>
                {info && <div className="color-weak text-break">{info}</div>}
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
