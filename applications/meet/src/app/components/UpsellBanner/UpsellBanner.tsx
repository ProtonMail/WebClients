import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { SettingsLink } from '@proton/components/index';
import { IcCross } from '@proton/icons/icons/IcCross';
import { IcUpgrade } from '@proton/icons/icons/IcUpgrade';
import { PLANS } from '@proton/payments/core/constants';
import { useFlag } from '@proton/unleash';

import { useIsTreatedAsPaidMeetUser } from '../../hooks/useIsTreatedAsPaidMeetUser';
import { canShowBanner } from '../../utils/canShowBanner';

import './UpsellColor.scss';

export const STORAGE_KEY = 'upsell_banner_dismissed_until';
export const DISMISS_DAYS = 30;

interface UpsellBannerProps {
    isPaid: boolean;
}

export const UpsellBanner = ({ isPaid }: UpsellBannerProps) => {
    const meetUpsellEnabled = useFlag('MeetUpsell');
    const [visible, setVisible] = useState(() => canShowBanner(STORAGE_KEY));

    const dismiss = () => {
        const expiresAt = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;

        try {
            localStorage.setItem(STORAGE_KEY, String(expiresAt));
        } catch {}

        setVisible(false);
    };

    if (!visible || !meetUpsellEnabled || isPaid) {
        return null;
    }

    const unlimitedMeeting = (
        <span key="unlimited-meeting" className="color-norm">{c('Info').t`unlimited meeting`}</span>
    );

    return (
        <div className="upsell-banner w-full py-4 grid items-center" style={{ gridTemplateColumns: 'auto 1fr auto' }}>
            <div />
            <div className="flex items-center justify-center gap-2 ml-5">
                <IcUpgrade className="upsell-banner-icon shrink-0" size={5} />
                <div className="color-weak text-semibold text-xs md:text-lg">
                    {
                        // translator: full sentence is "Unlock unlimited meeting and premium features" where "unlimited meeting" is emphasized in white color
                        c('Info').jt`Unlock ${unlimitedMeeting} and premium features`
                    }
                </div>
                <SettingsLink path={`/dashboard?plan=${PLANS.MEET_BUSINESS}`} className="shrink-0">
                    <Button className="rounded-full text-xs md:text-sm">{c('Action').t`Upgrade`}</Button>
                </SettingsLink>
            </div>

            <button onClick={dismiss} aria-label={c('Action').t`Close`} className="ml-auto ml-4 mr-4 cursor-pointer">
                <IcCross className="color-hint" size={5} alt={c('Action').t`Close`} />
            </button>
        </div>
    );
};

export const UpsellBannerWithUser = () => {
    const isTreatedAsPaid = useIsTreatedAsPaidMeetUser();

    return <UpsellBanner isPaid={isTreatedAsPaid} />;
};
