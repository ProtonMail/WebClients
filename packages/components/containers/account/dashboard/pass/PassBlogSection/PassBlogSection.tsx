import { c } from 'ttag';

import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import { getBlogURL } from '@proton/shared/lib/helpers/url';

import DashboardBlogSection from '../../shared/DashboardBlogSection/DashboardBlogSection';
import dataBreaches from './illustrations/data-breaches.jpg';
import emailAlias from './illustrations/email-alias.jpg';
import passkeys from './illustrations/passkeys.jpg';
import passwordManager from './illustrations/password-manager.jpg';
import safeUserName from './illustrations/safe-username.jpg';
import wifiPassword from './illustrations/wifi-password.jpg';

interface BlogPost {
    title: () => string;
    description: () => string;
    image: string;
    link: string;
}

const blogPosts: BlogPost[] = [
    {
        title: () => c('Blog').t`How to export passwords from Chrome`,
        description: () =>
            c('Blog')
                .t`If you want to leave Google, one of the first things you must do is stop using its proprietary browser, Chrome, and its built-in password manager. A vital first step towards leaving Google is downloading your passwords so you can transition more easily to a new, better password manager.`,
        image: passwordManager,
        link: getBlogURL('/how-to-export-passwords-from-chrome'),
    },
    {
        title: () => c('Blog').t`How to easily & securely share your WiFi password`,
        description: () =>
            c('Blog')
                .t`Helping someone connect to a new WiFi network is a regular occurrence. It’s likely you’ve done it many times at home or work. In this article, we’re going to examine the easiest ways to share WiFi passwords between devices, the risks associated with insecurely sharing your WiFi password, and the safest way to do it.`,
        image: wifiPassword,
        link: getBlogURL('/how-to-share-wifi-password'),
    },
    {
        title: () => c('Blog').t`What is a safe username?`,
        description: () =>
            c('Blog')
                .t`If you take your online safety seriously, you know you need to create a strong password to protect your online accounts. However, do you know that using the same username for all your accounts isn’t safe? In this article we go over why you should create varied and strong usernames.`,
        image: safeUserName,
        link: getBlogURL('/safe-username'),
    },
    {
        title: () => c('Blog').t`Take advantage of advanced email alias feature in ${PASS_APP_NAME}`,
        description: () =>
            c('Blog')
                .t`Navigating an internet full of data brokers, spam, scams, and malware feels increasingly difficult. That’s why ${PASS_APP_NAME} goes beyond helping you manage, store, and autofill your passwords. We give you the tools to take control of your privacy and protect your inboxes with hide-my-email aliases.`,
        image: emailAlias,
        link: getBlogURL('/benefits-of-email-aliases'),
    },
    {
        title: () => c('Blog').t`How to prevent data breaches in your business`,
        description: () =>
            c('Blog')
                .t`Data breaches are on the rise. For businesses, a single breach can result in stolen customer data, regulatory penalties, lost revenue, and lasting reputational damage. Luckily, your team can prevent most breaches with the right mix of security practices, technology, and awareness.`,
        image: dataBreaches,
        link: getBlogURL('/data-breach-prevention-for-businesses'),
    },
    {
        title: () => c('Blog').t`What are passkeys and how do they work?`,
        description: () =>
            c('Blog').t`Understand passkeys, their benefits over passwords, and how ${PASS_APP_NAME} keeps them safe.`,
        image: passkeys,
        link: getBlogURL('/what-is-a-passkey'),
    },
];

const PassBlogSection = () => {
    return <DashboardBlogSection posts={blogPosts} title={c('Title').t`Deep dive into password manager blog posts`} />;
};

export default PassBlogSection;
