import { c } from 'ttag';

import {
    DashboardGrid,
    DashboardGridSection,
    DashboardGridSectionHeader,
} from '@proton/atoms/DashboardGrid/DashboardGrid';
import { getBlogURL } from '@proton/shared/lib/helpers/url';

import breachRecommendations from './illustrations/breach-recommendations.jpg';
import customEmailDomain from './illustrations/custom-email-domain.jpg';
import emailAlias from './illustrations/email-alias.jpg';
import endToEndEncryption from './illustrations/end-to-end-encryption.jpg';
import inboxZero from './illustrations/inbox-zero.jpg';
import stopSpamEmails from './illustrations/stop-spam-emails.jpg';

import './MailBlogSection.scss';

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

export const MailBlogSection = () => {
    const linkRef = '?ref=web-setting-dashboard-a';

    return (
        <DashboardGrid>
            <DashboardGridSection>
                <DashboardGridSectionHeader title={c('Title').t`Deep dive into email blog posts`} />
            </DashboardGridSection>
            <DashboardGridSection>
                <div className="grid grid-cols-none lg:grid-cols-2 gap-6 lg:gap-x-8">
                    {blogPosts.map((post) => (
                        <a
                            target="_blank"
                            rel="noopener noreferrer"
                            href={post.link + linkRef}
                            key={post.link}
                            className="flex flex-column lg:flex-row flex-nowrap items-start gap-4 lg:gap-6 relative hover:color-norm color-norm rounded-lg text-no-decoration group interactive-pseudo-protrude interactive--no-background"
                            aria-label={post.title()}
                            style={{ '--interactive-inset': '-0.25rem' }}
                        >
                            <figure className="w-full lg:w-2/5 rounded overflow-hidden ratio-2/1">
                                <img src={post.image} alt="" className="w-full" />
                            </figure>
                            <div className="w-full">
                                <h3 className="text-lg text-semibold mt-0 mb-2 group-hover:text-underline group-hover:color-link">
                                    {post.title()}
                                </h3>
                                <p className="m-0 text-ellipsis-two-lines color-weak">{post.description()}</p>
                            </div>
                        </a>
                    ))}
                </div>
            </DashboardGridSection>
        </DashboardGrid>
    );
};

export default MailBlogSection;
