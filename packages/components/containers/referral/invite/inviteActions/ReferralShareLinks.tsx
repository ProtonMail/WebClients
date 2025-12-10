import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import FacebookIcon from './icons/facebook.svg';
import LinkedInIcon from './icons/linkedIn.svg';
import RedditIcon from './icons/reddit.svg';
import WhatsappIcon from './icons/whatsapp.svg';
import XIcon from './icons/x.svg';

interface ShareLinkProps {
    href: string;
    img: string;
    title: string;
}

const ShareLink = ({ href, img, title }: ShareLinkProps) => {
    return (
        <Href
            className="interactive-pseudo rounded relative shrink-0 grow-0"
            rel="noopener noreferrer"
            href={href}
            title={title}
        >
            <img src={img} alt="" className="rounded w-custom ratio-square" style={{ '--w-custom': '36px' }} />
        </Href>
    );
};

interface ReferralShareLinksProps {
    referralLink: string;
}

const getShareLinkTitle = (name: string) => {
    // Translator: For example "Share using LinkedIn"
    return c('Referral').t`Share using ${name}`;
};

const ReferralShareLinks = ({ referralLink }: ReferralShareLinksProps) => {
    const encodedLink = encodeURIComponent(referralLink);
    const text = encodeURIComponent(
        c('Referral')
            .t`I've been using ${BRAND_NAME} and thought you might like it. It's a secure email, cloud storage, password manager, and VPN that protects your privacy. Sign up with this link to get 14 days of premium features for free: ${referralLink}`
    );

    const linkedInURL = `https://www.linkedin.com/feed/?shareUrl=${encodedLink}&shareActive&mini=true&text=${text}&source=${encodeURIComponent(BRAND_NAME)}`;
    const xURL = `https://x.com/share?text=${text}&via=ProtonPrivacy`;
    const redditURL = `https://www.reddit.com/submit?url=${encodedLink}&title=${text}`;
    const facebookURL = `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}&quote=${text}`;
    const whatsappURL = `https://wa.me/?text=${text}`;

    return (
        <div className="flex gap-2">
            <ShareLink href={linkedInURL} img={LinkedInIcon} title={getShareLinkTitle('LinkedIn')} />
            <ShareLink href={xURL} img={XIcon} title={getShareLinkTitle('X')} />
            <ShareLink href={redditURL} img={RedditIcon} title={getShareLinkTitle('Reddit')} />
            <ShareLink href={facebookURL} img={FacebookIcon} title={getShareLinkTitle('Facebook')} />
            <ShareLink href={whatsappURL} img={WhatsappIcon} title={getShareLinkTitle('Whatsapp')} />
        </div>
    );
};

export default ReferralShareLinks;
