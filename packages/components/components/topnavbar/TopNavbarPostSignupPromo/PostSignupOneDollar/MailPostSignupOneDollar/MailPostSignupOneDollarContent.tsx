import type { ReactNode } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { DARK_WEB_MONITORING_NAME } from '@proton/shared/lib/constants';
import mailOfferSpotlight from '@proton/styles/assets/img/permanent-offer/mail_offer_spotlight.svg';

import { OfferContent } from '../components/OfferContent';
import { OfferLastReminderSpotlight } from '../components/OfferLastReminderSpotlight';
import { PostSignupOneDollarCheck } from '../components/PostSignupOneDollarCheck';
import { LAST_REMINDER_DAY } from '../interface';

interface Props {
    pricingTitle: ReactNode;
    onClose: () => void;
    onUpsellClick: () => void;
    daysSinceOffer: number;
}

const MB = 1024 * 1024;
const FREE_CHECKLIST_SPACE_MB = 500;

export const MailPostSignupDollarContent = ({ daysSinceOffer, onClose, pricingTitle, onUpsellClick }: Props) => {
    const [user] = useUser();
    const hasFinishedChecklist = user.MaxSpace / MB > FREE_CHECKLIST_SPACE_MB;

    if (daysSinceOffer >= LAST_REMINDER_DAY) {
        return <OfferLastReminderSpotlight product="mail" pricingTitle={pricingTitle} imgSrc={mailOfferSpotlight} />;
    }

    const features = [
        {
            id: 'storage',
            title: c('Offer feature').t`Storage`,
            free: hasFinishedChecklist ? '1 GB' : '500 MB',
            plus: '15 GB',
        },
        { id: 'addresses', title: c('Offer feature').t`Email addresses`, free: '1', plus: '10' },
        { id: 'domain', title: c('Offer feature').t`Custom email domain`, free: '–', plus: PostSignupOneDollarCheck },
        {
            id: 'dwm',
            title: (
                <div className="flex">
                    <span>{DARK_WEB_MONITORING_NAME}</span>
                    <span className="text-sm color-weak">{c('Offer feature').t`+10 more premium features`}</span>
                </div>
            ),
            free: '–',
            plus: PostSignupOneDollarCheck,
        },
    ];

    return <OfferContent product="mail" features={features} onClose={onClose} onUpsellClick={onUpsellClick} />;
};
