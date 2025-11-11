import { c } from 'ttag';

import PassLogo from '@proton/components/components/logo/PassLogo';
import { PLANS, PLAN_NAMES } from '@proton/payments';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import type { DashboardMoreInfoSection } from '../../../shared/DashboardMoreInfoSection/DashboardMoreInfoSection';
import {
    DashboardMoreInfoSectionTag,
    DashboardMoreInfoSections,
} from '../../../shared/DashboardMoreInfoSection/DashboardMoreInfoSection';
import dataBreach from './illustrations/data-breach.svg';
import protectFamily from './illustrations/protect-family.svg';
import shareAccountDetails from './illustrations/share-account-details.svg';
import spamFreeEmail from './illustrations/spam-free-email.svg';

const PassGetMoreSection = () => {
    const sections: DashboardMoreInfoSection[] = [
        {
            tag: (
                <DashboardMoreInfoSectionTag
                    key="protect-family-label"
                    prefix={<PassLogo variant="glyph-only" size={5} />}
                    text={PLAN_NAMES[PLANS.PASS_FAMILY]}
                />
            ),
            title: () => c('Blog').t`Protect your family online and make account sharing easy`,
            description: () => c('Blog').t`Learn how to make account sharing simple for any family member.`,
            image: protectFamily,
            link: 'https://proton.me/pass/family',
        },
        {
            title: () => c('Blog').t`Keep your email spam-free`,
            tag: (
                <DashboardMoreInfoSectionTag
                    key="spam-free-email-label"
                    prefix={<PassLogo variant="glyph-only" size={5} />}
                    text={PLAN_NAMES[PLANS.PASS]}
                />
            ),
            description: () => c('Blog').t`Sign up for services without sharing your email with aliases.`,
            image: spamFreeEmail,
            link: 'https://proton.me/pass/aliases',
        },
        {
            title: () => c('Blog').t`Worried about data breaches?`,
            tag: (
                <DashboardMoreInfoSectionTag
                    key="data-breach-label"
                    prefix={<PassLogo variant="glyph-only" size={5} />}
                    text={PLAN_NAMES[PLANS.PASS_BUSINESS]}
                />
            ),
            description: () => c('Blog').t`Protect your company with strong passwords and safe sharing.`,
            image: dataBreach,
            link: 'https://proton.me/business/pass',
        },
        {
            title: () => c('Blog').t`Share your account details, without risking a hack`,
            tag: (
                <DashboardMoreInfoSectionTag
                    key="protect-family-label"
                    prefix={<PassLogo variant="glyph-only" size={5} />}
                    text={PLAN_NAMES[PLANS.PASS]}
                />
            ),
            description: () =>
                c('Blog').t`Learn how to share a single item, an encrypted link or a vault through ${PASS_APP_NAME}.`,
            image: shareAccountDetails,
            link: 'https://proton.me/pass/password-sharing',
        },
    ];

    return <DashboardMoreInfoSections sections={sections} />;
};

export default PassGetMoreSection;
