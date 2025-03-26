import { c } from 'ttag';

import Details from '@proton/components/components/container/Details';
import Summary from '@proton/components/components/container/Summary';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { VPN_APP_NAME } from '@proton/shared/lib/constants';

import adTargetIcon from './icon-ad-target.svg';
import computerIcon from './icon-computer.svg';
import geoIcon from './icon-geo.svg';
import surveillanceIcon from './icon-surveillance.svg';
import trackingIcon from './icon-tracking.svg';
import wifiIcon from './icon-wifi.svg';

interface Props {
    isVpnConnection: boolean;
}

const getTitle = (isVpnConnection: boolean) => {
    if (isVpnConnection) {
        return c('Title').t`Get more from your VPN`;
    }

    return c('Title').t`VPN explained`;
};

const getFaq = (isVpnConnection: boolean) => {
    if (isVpnConnection) {
        return [
            {
                id: 'when-is-it-most-important-to-use-a-vpn',
                title: c('Title').t`When is it most important to use a VPN?`,
                content: (
                    <>
                        <p className="my-2">{c('Info')
                            .t`It’s best to use a VPN at all times. But here’s when cybersecurity threats can be the highest:`}</p>
                        <div className="flex flex-row flex-nowrap mb-1">
                            <div className="shrink-0">
                                <img src={geoIcon} alt="" />
                            </div>
                            <div className="ml-2">
                                <div className="text-semibold mt-0.5">{c('Info').t`In restrictive countries`}</div>
                                <p className="my-2">{c('Info')
                                    .t`Some governments block or restrict access to certain websites. A VPN helps bypass censorship while keeping your activity and identity private.`}</p>
                            </div>
                        </div>
                        <div className="flex flex-row flex-nowrap mb-1">
                            <div className="shrink-0">
                                <img src={wifiIcon} alt="" />
                            </div>
                            <div className="ml-2">
                                <div className="text-semibold mt-0.5">{c('Info').t`On public WiFi networks`}</div>
                                <p className="my-2">{c('Info')
                                    .t`Most public WiFi networks are safe, but some lack security, exposing you to cyber threats. A VPN encrypts your traffic, keeping you protected.`}</p>
                            </div>
                        </div>
                        <div className="flex flex-row flex-nowrap">
                            <div className="shrink-0">
                                <img src={computerIcon} alt="" />
                            </div>
                            <div className="ml-2">
                                <div className="text-semibold mt-0.5">{c('Info').t`When working remotely`}</div>
                                <p className="my-2">{c('Info')
                                    .t`A secure connection is essential when working remotely. A VPN protects company data from cyber threats and keeps your work private.`}</p>
                            </div>
                        </div>
                    </>
                ),
            },
            {
                id: 'make-a-secure-connection-your-default',
                title: c('Title').t`Make a secure connection your default`,
                content: (
                    <>
                        <p className="my-2">{c('Info')
                            .t`Stay connected effortlessly by enabling the following VPN settings:`}</p>
                        <ul className="my-2">
                            <li className="mb-2">
                                {getBoldFormattedText(
                                    // translators: preserve the ** characters
                                    c('Info')
                                        .t`**Kill switch**: Stops data leaks by blocking your internet if the VPN drops unexpectedly.`
                                )}
                            </li>
                            <li className="mb-2">
                                {getBoldFormattedText(
                                    // translators: preserve the ** characters
                                    c('Info')
                                        .t`**Auto-connect**: Opens and connects to VPN as soon as you turn on your device.`
                                )}
                            </li>
                        </ul>
                    </>
                ),
            },
        ];
    }

    return [
        {
            id: 'what-is-a-vpn',
            title: c('Title').t`What is a VPN?`,
            content: c('Info')
                .t`A VPN is a secure tunnel between your device and the internet. It hides your location and activity from your internet service provider (ISP) and the websites you visit.`,
        },
        {
            id: 'what-can-a-vpn-protect-you-from',
            title: c('Title').t`What can a VPN protect you from?`,
            content: (
                <>
                    <div className="flex flex-row flex-nowrap mb-1">
                        <div className="shrink-0">
                            <img src={geoIcon} alt="" />
                        </div>
                        <div className="ml-2">
                            <div className="text-semibold mt-0.5">{c('Info').t`Geoblocking`}</div>
                            <p className="my-2">{c('Info')
                                .t`Some websites and streaming services block content by region. A VPN lets you bypass these restrictions and access the internet freely.`}</p>
                        </div>
                    </div>
                    <div className="flex flex-row flex-nowrap mb-1">
                        <div className="shrink-0">
                            <img src={trackingIcon} alt="" />
                        </div>
                        <div className="ml-2">
                            <div className="text-semibold mt-0.5">{c('Info').t`Tracking`}</div>
                            <p className="my-2">{c('Info')
                                .t`A VPN hides your IP address and encrypts your browsing activity, making it harder for websites, advertisers, and ISPs to track you over time.`}</p>
                        </div>
                    </div>
                    <div className="flex flex-row flex-nowrap mb-1">
                        <div className="shrink-0">
                            <img src={adTargetIcon} alt="" />
                        </div>
                        <div className="ml-2">
                            <div className="text-semibold mt-0.5">{c('Info').t`Ad targeting`}</div>
                            <p className="my-2">{c('Info')
                                .t`Advertisers track your browsing to show targeted ads. ${VPN_APP_NAME} blocks trackers and ads, making your connection faster and improving your online experience.`}</p>
                        </div>
                    </div>
                    <div className="flex flex-row flex-nowrap">
                        <div className="shrink-0">
                            <img src={surveillanceIcon} alt="" />
                        </div>
                        <div className="ml-2">
                            <div className="text-semibold mt-0.5">{c('Info').t`Surveillance`}</div>
                            <p className="my-2">{c('Info')
                                .t`Governments and ISPs can monitor your online activity. By hiding your real IP and encrypting your activity your browsing becomes private.`}</p>
                        </div>
                    </div>
                </>
            ),
        },
        {
            id: 'private-browsing-vs-vpn',
            title: c('Title').t`Private browsing vs VPN`,
            content: (
                <>
                    <p className="my-2">{c('Info')
                        .t`Private browsing (or “incognito” mode) is only useful for keeping your activity hidden on your device. It stops your browser from saving history and cookies, but it doesn’t make you invisible. Your ISP, network administrator, and the websites you visit can still see what you do online.`}</p>
                    <p className="my-2">{c('Info')
                        .t`A VPN encrypts your connection and hides your IP address, making it much harder for anyone to track or monitor your browsing.`}</p>
                </>
            ),
        },
        {
            id: 'how-does-it-all-work',
            title: c('Title').t`How does it all work?`,
            content: (
                <>
                    <p className="my-2">{c('Info')
                        .t`When you connect to VPN, it uses encryption technology to hide your IP address (a unique code assigned to your device).`}</p>
                    <p className="my-2">{c('Info')
                        .t`This means that your ISP and the websites you visit can’t connect your personal information with your online activity.`}</p>
                </>
            ),
        },
    ];
};

const VPNFAQ = ({ isVpnConnection }: Props) => {
    const title = getTitle(isVpnConnection);
    const faq = getFaq(isVpnConnection);

    if (faq.length === 0) {
        return null;
    }

    return (
        <div className="w-full mt-4">
            <h3 className="text-rg text-bold mt-1 mb-2">{title}</h3>
            {faq.map(({ id, title, content }) => (
                <Details key={id} className="mb-2 border-none">
                    <Summary
                        className="text-semibold text-sm relative interactive-pseudo pl-1 rounded-lg"
                        classNameChildren="mt-0.5 mb-0.5"
                        useTriangle
                    >
                        {title}
                    </Summary>
                    <div className="color-weak mt-1 text-sm ml-6">{content}</div>
                </Details>
            ))}
        </div>
    );
};

export default VPNFAQ;
