import { c } from 'ttag';

import { DashboardGrid, DashboardGridSection, DashboardGridSectionHeader } from '@proton/atoms';
import { VPN_APP_NAME } from '@proton/shared/lib/constants';

import changeIpAddress from './illustrations/change-ip-address.jpg';
import internetHistory from './illustrations/internet-history.jpg';
import noLogs from './illustrations/no-logs.jpg';
import telegram from './illustrations/telegram.jpg';
import vpnAccelerator from './illustrations/vpn-accelerator.jpg';
import vpnProtocol from './illustrations/vpn-protocol.jpg';

interface BlogPost {
    title: () => string;
    description: () => string;
    image: string;
    link: string;
}

const blogPosts: BlogPost[] = [
    {
        title: () => c('Blog').t`${VPN_APP_NAME}'s no-logs policy confirmed by an external audit`,
        description: () =>
            c('Blog')
                .t`Independent security experts verified that ${VPN_APP_NAME} does not log user data or engage in any practices that might compromise your privacy.`,
        image: noLogs,
        link: 'https://protonvpn.com/blog/no-logs-audit',
    },
    {
        title: () => c('Blog').t`Increase VPN speeds by up to 400% with VPN Accelerator`,
        description: () =>
            c('Blog')
                .t`VPN Accelerator uses a combination of advanced VPN technologies to improve connection stability and increase your connection speed`,
        image: vpnAccelerator,
        link: 'https://protonvpn.com/blog/vpn-accelerator',
    },
    {
        title: () => c('Blog').t`Can someone see my internet history if we use the same WiFi?`,
        description: () =>
            c('Blog')
                .t`In this article, we look at who can see your internet history when you use WiFi, what they can see, and why they might do this.`,
        image: internetHistory,
        link: 'https://protonvpn.com/blog/internet-history-wifi',
    },
    {
        title: () => c('Blog').t`Which VPN protocol is the best?`,
        description: () =>
            c('Blog').t`This article has been updated to include the WireGuard and Stealth VPN protocols.`,
        image: vpnProtocol,
        link: 'https://protonvpn.com/blog/whats-the-best-vpn-protocol',
    },
    {
        title: () => c('Blog').t`How safe is Telegram?`,
        description: () =>
            c('Blog')
                .t`Is Telegram safe to use? As we'll discuss in this article, that very much depends on how you use it.`,
        image: telegram,
        link: 'https://protonvpn.com/blog/is-telegram-safe',
    },
    {
        title: () => c('Blog').t`Which VPN protocol is the best?`,
        description: () =>
            c('Blog').t`This article has been updated to include the WireGuard and Stealth VPN protocols.`,
        image: changeIpAddress,
        link: 'https://protonvpn.com/blog/change-ip-address-windows',
    },
];

export const VpnBlogSection = () => {
    const linkRef = '?ref=web-setting-dashboard-a';

    return (
        <DashboardGrid>
            <DashboardGridSection>
                <DashboardGridSectionHeader title={c('Title').t`Deep dive into VPN blog posts`} />
            </DashboardGridSection>
            <DashboardGridSection>
                <div className="grid grid-cols-none lg:grid-cols-2 gap-6 lg:gap-x-8">
                    {blogPosts.map((post) => (
                        <a
                            target="_blank"
                            rel="noopener noreferrer"
                            href={post.link + linkRef}
                            key={post.link}
                            className="flex flex-column lg:flex-row flex-nowrap items-start gap-4 lg:gap-6 relative rounded-lg interactive-pseudo-protrude text-no-decoration"
                            aria-label={post.title()}
                        >
                            <figure className="w-full lg:w-2/5 rounded overflow-hidden ratio-2/1">
                                <img src={post.image} alt="" className="w-full" />
                            </figure>
                            <div className="w-full">
                                <h3 className="text-lg text-semibold mt-0 mb-2">{post.title()}</h3>
                                <p className="m-0 text-ellipsis-two-lines color-weak">{post.description()}</p>
                            </div>
                        </a>
                    ))}
                </div>
            </DashboardGridSection>
        </DashboardGrid>
    );
};

export default VpnBlogSection;
