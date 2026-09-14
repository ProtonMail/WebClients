import type { MouseEventHandler } from 'react';
import { type FC, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { IconComponent } from '@proton/icons/component';
import { IcBrandReddit } from '@proton/icons/icons/IcBrandReddit';
import { IcBrandTwitter } from '@proton/icons/icons/IcBrandTwitter';
import { IcGift } from '@proton/icons/icons/IcGift';
import { IcLifeRing } from '@proton/icons/icons/IcLifeRing';
import { IcRocket } from '@proton/icons/icons/IcRocket';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import { PASS_HOWTO_URL, PASS_REDDIT_URL, PASS_REQUEST_URL, PASS_X_URL } from '../../constants';
import { usePassCore } from '../Core/PassCoreProvider';
import { CouponModal } from './CouponModal';
import { SettingsPanel } from './SettingsPanel';

type FeedbackItem = {
    icon: IconComponent;
    label: string;
    onClick: MouseEventHandler;
};

export const Feedback: FC = () => {
    const { onLink } = usePassCore();
    const [openCouponModal, setOpenCouponModal] = useState(false);

    const feedback: FeedbackItem[] = [
        {
            icon: IcLifeRing,
            label: c('Action').t`How to use ${PASS_APP_NAME}`,
            onClick: () => onLink(PASS_HOWTO_URL),
        },
        {
            icon: IcBrandTwitter,
            label: c('Action').t`Write us on X/Twitter`,
            onClick: () => onLink(PASS_X_URL),
        },
        {
            icon: IcBrandReddit,
            label: c('Action').t`Join our Reddit`,
            onClick: () => onLink(PASS_REDDIT_URL),
        },
        {
            icon: IcRocket,
            label: c('Action').t`Request a feature`,
            onClick: () => onLink(PASS_REQUEST_URL),
        },
        {
            icon: IcGift,
            label: c('Action').t`Apply lifetime coupon code`,
            onClick: () => setOpenCouponModal(true),
        },
    ];

    return (
        <>
            <SettingsPanel title={c('Label').t`Feedback`}>
                {feedback.map(({ onClick, label, icon: Icon }) => (
                    <Button
                        onClick={onClick}
                        className="w-full flex items-center gap-2 shrink-0 flex-nowrap"
                        size="small"
                        shape="ghost"
                        key={label}
                        title={label}
                        icon
                    >
                        <Icon />
                        {label}
                    </Button>
                ))}
            </SettingsPanel>
            {openCouponModal && <CouponModal onClose={() => setOpenCouponModal(false)} />}
        </>
    );
};
