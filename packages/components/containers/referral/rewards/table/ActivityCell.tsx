import type { ReactNode } from 'react';

import { c } from 'ttag';

import { IcCheckmarkCircle } from '@proton/icons/icons/IcCheckmarkCircle';
import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';
import { IcCircleRadioEmpty } from '@proton/icons/icons/IcCircleRadioEmpty';
import type { Referral } from '@proton/shared/lib/interfaces';
import { ReferralState } from '@proton/shared/lib/interfaces';

type TickLevel = 'empty' | 'partial' | 'complete';

interface TickIconProps {
    level: TickLevel;
    text: string;
}

const TickIcon = ({ level, text }: TickIconProps) => {
    const icon: ReactNode | undefined = (() => {
        if (level === 'empty') {
            return <IcCircleRadioEmpty className="shrink-0 color-disabled" size={4} />;
        }

        if (level === 'partial') {
            return <IcCheckmarkCircle className="shrink-0 color-success" size={4} />;
        }

        if (level === 'complete') {
            return <IcCheckmarkCircleFilled className="shrink-0 color-success" size={4} />;
        }
    })();

    if (!icon) {
        return null;
    }

    return (
        <div className="flex items-center gap-2">
            {icon}
            <span>{text}</span>
        </div>
    );
};

interface Props {
    referral: Referral;
}

const ActivityCell = ({ referral }: Props) => {
    if (referral.State === ReferralState.INVITED) {
        return <TickIcon level="empty" text={c('Info').t`Invited`} />;
    }

    if (referral.State === ReferralState.SIGNED_UP || referral.State === ReferralState.TRIAL) {
        return <TickIcon level="partial" text={c('Info').t`Signed up`} />;
    }

    if (referral.State === ReferralState.COMPLETED || referral.State === ReferralState.REWARDED) {
        return <TickIcon level="complete" text={c('Info').t`Paid for a plan`} />;
    }

    return null;
};

export default ActivityCell;
