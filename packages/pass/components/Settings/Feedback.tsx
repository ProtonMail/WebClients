import type { MouseEventHandler } from 'react';
import { type FC, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Icon from '@proton/components/components/icon/Icon';
import type { IconName } from '@proton/icons/types';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { PASS_HOWTO_URL, PASS_REDDIT_URL, PASS_REQUEST_URL, PASS_X_URL } from '@proton/pass/constants';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import { CouponModal } from './CouponModal';
import { SettingsPanel } from './SettingsPanel';

type FeedbackItem = {
    icon: IconName;
    label: string;
    onClick: MouseEventHandler;
};

export const Feedback: FC = () => {
    const { onLink } = usePassCore();
    const [openCouponModal, setOpenCouponModal] = useState(false);

    const feedback: FeedbackItem[] = [
        {
            icon: 'life-ring',
            label: c('Action').t`How to use ${PASS_APP_NAME}`,
            onClick: () => onLink(PASS_HOWTO_URL),
        },
        {
            icon: 'brand-twitter',
            label: c('Action').t`Write us on X/Twitter`,
            onClick: () => onLink(PASS_X_URL),
        },
        {
            icon: 'brand-reddit',
            label: c('Action').t`Join our Reddit`,
            onClick: () => onLink(PASS_REDDIT_URL),
        },
        {
            icon: 'rocket',
            label: c('Action').t`Request a feature`,
            onClick: () => onLink(PASS_REQUEST_URL),
        },
        {
            icon: 'gift',
            label: c('Action').t`Apply lifetime coupon code`,
            onClick: () => setOpenCouponModal(true),
        },
    ];

    return (
        <>
            <SettingsPanel title={c('Label').t`Feedback`}>
                {feedback.map(({ onClick, label, icon }) => (
                    <Button
                        onClick={onClick}
                        className="w-full flex items-center gap-2 shrink-0 flex-nowrap"
                        size="small"
                        shape="ghost"
                        key={label}
                        title={label}
                        icon
                    >
                        <Icon name={icon} />
                        {label}
                    </Button>
                ))}
            </SettingsPanel>
            {openCouponModal && <CouponModal onClose={() => setOpenCouponModal(false)} />}
        </>
    );
};
