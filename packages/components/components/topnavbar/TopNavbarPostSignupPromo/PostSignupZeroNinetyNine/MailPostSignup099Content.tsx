import type { ReactNode } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';

import { ZeroNinetyNineCheck } from './components/ZeroNinetyNineCheck';
import { ZeroNinetyNineFooter } from './components/ZeroNinetyNineFooter';
import { ZeroNinetyNineLastReminder } from './components/ZeroNinetyNineLastReminder';
import { ZeroNinetyNineTable } from './components/ZeroNinetyNineTable';
import { ZeroNinetyNineTitle } from './components/ZeroNinetyNineTitle';
import { ZERO_NINETY_NINE_LAST_REMINDER_DAY } from './interface';

interface Props {
    pricingTitle: ReactNode;
    onUpsellClick: () => void;
    onNeverShow: () => void;
    daysSinceOffer: number;
}

const MB = 1024 * 1024;
const FREE_CHECKLIST_SPACE_MB = 500;

export const MailPostSignup099Content = ({ daysSinceOffer, pricingTitle, onUpsellClick, onNeverShow }: Props) => {
    const [user] = useUser();
    const hasFinishedChecklist = user.MaxSpace / MB > FREE_CHECKLIST_SPACE_MB;

    if (daysSinceOffer >= ZERO_NINETY_NINE_LAST_REMINDER_DAY) {
        return <ZeroNinetyNineLastReminder pricingTitle={pricingTitle} />;
    }

    const features = [
        {
            id: 'storage',
            title: c('Offer feature').t`Storage`,
            free: hasFinishedChecklist ? '1 GB' : '500 MB',
            plus: '15 GB',
        },
        { id: 'addresses', title: c('Offer feature').t`Email addresses`, free: '1', plus: '10' },
        { id: 'domain', title: c('Offer feature').t`Custom email domain`, free: '–', plus: ZeroNinetyNineCheck },
        {
            id: 'short-domain',
            title: (
                <div className="flex">
                    <span>{c('Offer feature').t`Short @pm.me address`}</span>
                    <span className="text-sm color-weak">{c('Offer feature').t`+10 more premium features`}</span>
                </div>
            ),
            free: '–',
            plus: ZeroNinetyNineCheck,
        },
    ];

    return (
        <section className="p-6 pt-12">
            <ZeroNinetyNineTitle />
            <ZeroNinetyNineTable features={features} />
            <ZeroNinetyNineFooter onUpsellClick={onUpsellClick} onNeverShow={onNeverShow} />
        </section>
    );
};
