import { memo } from 'react';
import { useSelector } from 'react-redux';

import { c, msgid } from 'ttag';

import { Avatar } from '@proton/atoms/Avatar/Avatar';
import { UpgradeButton } from '@proton/pass/components/Upsell/UpgradeButton';
import { UpsellRef } from '@proton/pass/constants';
import { isPaidPlan } from '@proton/pass/lib/user/user.predicates';
import {
    selectPassPlan,
    selectPlanDisplayName,
    selectTrialDaysRemaining,
    selectUser,
} from '@proton/pass/store/selectors';

export const SettingsHeader = memo(() => {
    const user = useSelector(selectUser);
    const passPlan = useSelector(selectPassPlan);
    const planDisplayName = useSelector(selectPlanDisplayName);
    const trialDaysLeft = useSelector(selectTrialDaysRemaining);

    return (
        <div className="mb-8">
            <div className="flex w-full justify-space-between items-start">
                <div className="flex items-start">
                    <Avatar className="mr-2 mt-1">{user?.DisplayName?.toUpperCase()?.[0]}</Avatar>
                    <span>
                        <span className="block text-semibold text-ellipsis">{user?.DisplayName}</span>
                        <span className="block text-sm text-ellipsis">{user?.Email}</span>
                        <span className="block color-weak text-sm text-italic">{planDisplayName}</span>
                    </span>
                </div>
                <div className="flex items-end flex-column">
                    {!isPaidPlan(passPlan) && (
                        <>
                            <span className="block mb-1">
                                {planDisplayName}
                                <span className="color-weak text-italic text-sm">
                                    {' '}
                                    {trialDaysLeft &&
                                        `(${c('Info').ngettext(
                                            msgid`${trialDaysLeft} day left`,
                                            `${trialDaysLeft} days left`,
                                            trialDaysLeft
                                        )})`}
                                </span>
                            </span>
                            <UpgradeButton inline upsellRef={UpsellRef.SETTING} />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
});

SettingsHeader.displayName = 'SettingsHeaderMemo';
