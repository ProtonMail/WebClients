import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Tabs from '@proton/components/components/tabs/Tabs';
import { VPN_APP_NAME } from '@proton/shared/lib/constants';
import { isMac, isWindows } from '@proton/shared/lib/helpers/browser';

import DrawerAppSection from '../shared/DrawerAppSection';
import linuxDesktopImage from './proton-vpn-desktop-linux.png';
import macDesktopImage from './proton-vpn-desktop-mac.png';
import windowsDesktopImage from './proton-vpn-desktop-windows.png';
import mobileImage from './proton-vpn-mobile-qr-code.png';

interface Props {
    onDownload: () => void;
    isVpnConnection: boolean;
}

enum Platform {
    DESKTOP = 0,
    MOBILE = 1,
}

const getDesktopCTA = () => {
    if (isMac()) {
        return c('Drawer tab, Action').t`Download for macOS`;
    }

    if (isWindows()) {
        return c('Drawer tab, Action').t`Download for Windows`;
    }

    return c('Drawer tab, Action').t`Download for Linux`;
};

const getDesktopImage = () => {
    if (isMac()) {
        return macDesktopImage;
    }

    if (isWindows()) {
        return windowsDesktopImage;
    }

    return linuxDesktopImage;
};

const GetVPNApp = ({ onDownload, isVpnConnection }: Props) => {
    const [platform, setPlatform] = useState<Platform>(isVpnConnection ? Platform.MOBILE : Platform.DESKTOP);
    const desktopCTA = getDesktopCTA();
    const desktopImage = getDesktopImage();

    const tabs = [
        {
            title: c('Title').t`Desktop`,
            content: (
                <div className="flex flex-column gap-2 items-center">
                    <img src={desktopImage} alt="" width="250" height="140" />
                    <Button fullWidth shape="solid" color="norm" onClick={onDownload}>
                        {desktopCTA}
                    </Button>
                </div>
            ),
        },
        {
            title: c('Title').t`Mobile`,
            content: (
                <div>
                    <img src={mobileImage} alt="" width="250" height="140" />
                    <p className="color-weak text-sm text-wrap-balance text-center mb-0.5 py-1">{c('Info')
                        .t`Scan the QR code with your mobile device`}</p>
                </div>
            ),
        },
    ];

    return (
        <div className="w-full">
            <h3 className="text-rg text-bold mt-1">{c('Title').t`Download the app`}</h3>
            <div className="text-sm color-weak mt-1 mb-3">{c('Info')
                .t`Connect to ${VPN_APP_NAME} to browse privately`}</div>
            <DrawerAppSection className="sm:p-3">
                <Tabs variant="modern" fullWidth value={platform} onChange={setPlatform} tabs={tabs} />
            </DrawerAppSection>
        </div>
    );
};

export default GetVPNApp;
