import type { ReactNode } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { COUPON_CODES } from '@proton/payments/core/constants';
import mailOfferSpotlight from '@proton/styles/assets/img/permanent-offer/mail_offer_spotlight.svg';

import { OfferContent } from '../PostSignupOneDollar/components/OfferContent';
import { OfferLastReminderSpotlight } from '../PostSignupOneDollar/components/OfferLastReminderSpotlight';
import { PostSignupOneDollarCheck } from '../PostSignupOneDollar/components/PostSignupOneDollarCheck';
import { LAST_REMINDER_DAY } from '../PostSignupOneDollar/interface';

interface Props {
    pricingTitle: ReactNode;
    onClose: () => void;
    onUpsellClick: () => void;
    onNeverShow: () => void;
    daysSinceOffer: number;
}

const MB = 1024 * 1024;
const FREE_CHECKLIST_SPACE_MB = 500;

export const MailPostSignup099Content = ({
    daysSinceOffer,
    onClose,
    pricingTitle,
    onUpsellClick,
    onNeverShow,
}: Props) => {
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
            id: 'short-domain',
            title: (
                <div className="flex">
                    <span>{c('Offer feature').t`Short @pm.me address`}</span>
                    <span className="text-sm color-weak">{c('Offer feature').t`+10 more premium features`}</span>
                </div>
            ),
            free: '–',
            plus: PostSignupOneDollarCheck,
        },
    ];

    return (
        <OfferContent
            product="mail"
            features={features}
            onClose={onClose}
            onUpsellClick={onUpsellClick}
            onNeverShow={onNeverShow}
            coupon={COUPON_CODES.TRYMAILPLUS0926}
            gradient="purple-blue"
        />
    );
};
