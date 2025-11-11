import { c } from 'ttag';

import { getBlogURL } from '@proton/shared/lib/helpers/url';

import DashboardBlogSection from '../../shared/DashboardBlogSection/DashboardBlogSection';
import breachRecommendations from './illustrations/breach-recommendations.jpg';
import customEmailDomain from './illustrations/custom-email-domain.jpg';
import emailAlias from './illustrations/email-alias.jpg';
import endToEndEncryption from './illustrations/end-to-end-encryption.jpg';
import inboxZero from './illustrations/inbox-zero.jpg';
import stopSpamEmails from './illustrations/stop-spam-emails.jpg';

interface BlogPost {
    title: () => string;
    description: () => string;
    image: string;
    link: string;
}

const blogPosts: BlogPost[] = [
    {
        title: () => c('Blog').t`How to get to inbox zero: Privacy-first inbox organization tips`,
        description: () =>
            c('Blog')
                .t`The average professional receives around 120 emails a day, amounting to roughly 43,800 emails a year. No matter what industry you work in, that’s an overwhelming amount of business email to deal with.`,
        image: inboxZero,
        link: getBlogURL('/inbox-zero'),
    },
    {
        title: () => c('Blog').t`How to get a custom email domain`,
        description: () =>
            c('Blog')
                .t`If you want to elevate your professional identity, it’s important to learn why and how to create a custom email domain. Most people use free email addresses with default domains provided by their email service.`,
        image: customEmailDomain,
        link: getBlogURL('/custom-email-domain'),
    },
    {
        title: () => c('Blog').t`What to do if your data is leaked in a data breach`,
        description: () =>
            c('Blog')
                .t`The impact a data breach can have on your life depends greatly on the type of information that was exposed and to whom. A quick reaction to a data breach can often protect your digital identity and prevent any losses.`,
        image: breachRecommendations,
        link: getBlogURL('/breach-recommendations'),
    },
    {
        title: () => c('Blog').t`What is an email alias?`,
        description: () =>
            c('Blog')
                .t`Your personal email address is an essential part of your digital identity. Like your phone number, you don’t give it to everyone you meet. That’s why it’s useful to have other email addresses you can use for different purposes.`,
        image: emailAlias,
        link: getBlogURL('/what-is-email-alias'),
    },
    {
        title: () => c('Blog').t`What is end-to-end encryption and how does it work?`,
        description: () =>
            c('Blog')
                .t`The most private and secure way to communicate online is by using end-to-end encryption. If you send an end-to-end encrypted email, it’s encrypted on your device (your iPhone, Android, or laptop) and isn’t decrypted until it reaches the device of the person you sent the message to.`,
        image: endToEndEncryption,
        link: getBlogURL('/what-is-end-to-end-encryption'),
    },
    {
        title: () => c('Blog').t`11 tips to stop spam emails`,
        description: () =>
            c('Blog')
                .t`Learn how to beat annoying and potentially harmful junk mail. Spam emails, also known as junk mail, can be more than just irritating clutter in your inbox. Cybercriminals can use these unsolicited and unwanted messages to launch phishing attacks and spread malware.`,
        image: stopSpamEmails,
        link: getBlogURL('/how-to-stop-spam-emails'),
    },
];

const MailBlogSection = () => {
    return <DashboardBlogSection posts={blogPosts} title={c('Title').t`Deep dive into email blog posts`} />;
};

export default MailBlogSection;
