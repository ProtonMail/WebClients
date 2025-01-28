import { type ReactNode } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import driveOfferSpotlight from '@proton/styles/assets/img/permanent-offer/drive_offer_spotlight.svg';

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
const FREE_CHECKLIST_SPACE_MB = 2048;

export const DrivePostSignupDollarContent = ({ pricingTitle, daysSinceOffer, onClose, onUpsellClick }: Props) => {
    const [user] = useUser();
    const hasFinishedChecklist = user.MaxDriveSpace / MB > FREE_CHECKLIST_SPACE_MB;

    if (daysSinceOffer >= LAST_REMINDER_DAY) {
        return <OfferLastReminderSpotlight product="drive" pricingTitle={pricingTitle} imgSrc={driveOfferSpotlight} />;
    }

    const features = [
        {
            id: 'storage',
            title: c('Offer feature').t`Storage`,
            free: hasFinishedChecklist ? '5 GB' : '2 GB',
            plus: '200 GB',
        },
        {
            id: 'document',
            title: c('Offer feature').t`Online document editor`,
            free: PostSignupOneDollarCheck,
            plus: PostSignupOneDollarCheck,
        },
        {
            id: 'file_recovery',
            title: c('Offer feature').t`Recover previous file versions`,
            free: '–',
            plus: PostSignupOneDollarCheck,
        },
    ];

    return <OfferContent product="drive" features={features} onClose={onClose} onUpsellClick={onUpsellClick} />;
};
