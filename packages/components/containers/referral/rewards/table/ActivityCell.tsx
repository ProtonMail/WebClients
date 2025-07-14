import { c } from 'ttag';

import type { Referral } from '@proton/shared/lib/interfaces';
import { ReferralState } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import Icon, { type IconName } from '../../../../components/icon/Icon';

type TickLevel = 'empty' | 'partial' | 'complete';

interface TickIconProps {
    level: TickLevel;
    text: string;
}

const TickIcon = ({ level, text }: TickIconProps) => {
    const properties: { colorClassName: string; icon: IconName } | undefined = (() => {
        if (level === 'empty') {
            return { colorClassName: 'color-disabled', icon: 'circle-radio-empty' };
        }

        if (level === 'partial') {
            return { colorClassName: 'color-success', icon: 'checkmark-circle' };
        }

        if (level === 'complete') {
            return { colorClassName: 'color-success', icon: 'checkmark-circle-filled' };
        }
    })();

    if (!properties) {
        return null;
    }

    return (
        <div className="flex items-center gap-2">
            <Icon name={properties.icon} className={clsx('shrink-0', properties.colorClassName)} size={4} />
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
