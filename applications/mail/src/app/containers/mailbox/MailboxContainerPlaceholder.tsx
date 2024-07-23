import { useEffect, useMemo, useState } from 'react';

import { differenceInDays } from 'date-fns';

import { FeatureCode, useFlag } from '@proton/components/containers';
import { useFeature } from '@proton/components/hooks';
import type { Cancellable } from '@proton/components/hooks/useHandler';
import { CHECKLIST_DISPLAY_TYPE } from '@proton/shared/lib/interfaces';

import { TipBox, useTips } from 'proton-mail/components/list/tip';
import useGetRandomTip from 'proton-mail/components/list/tip/useGetRandomTip';

import UsersOnboardingChecklist from '../../components/checklist/UsersOnboardingChecklist';
import PlaceholderView from '../../components/view/PlaceholderView';
import { useGetStartedChecklist } from '../onboardingChecklist/provider/GetStartedChecklistProvider';

interface Props {
    showPlaceholder: boolean;
    welcomeFlag: boolean;
    labelID: string;
    checkedIDs: string[];
    handleCheckAll: ((check: boolean) => void) & Cancellable;
}

const MailboxContainerPlaceholder = ({ showPlaceholder, welcomeFlag, labelID, checkedIDs, handleCheckAll }: Props) => {
    const { loading: loadingChecklist, displayState, canDisplayChecklist } = useGetStartedChecklist();
    const { feature: protonTipsSnoozeTime, update } = useFeature(FeatureCode.ProtonTipsSnoozeTime);
    const protonTipsEnabled = useFlag('ProtonTips');
    const [shouldDisplayTips, setShouldDisplayTips] = useState(false);
    const { tips: tipMessages, isTipDismissed, setIsTipDismissed } = useTips();
    const { getRandomOption } = useGetRandomTip(tipMessages);

    useEffect(() => {
        if (!protonTipsSnoozeTime) {
            return;
        }

        const displayTips = differenceInDays(new Date(), protonTipsSnoozeTime.Value) >= 60;
        setShouldDisplayTips(displayTips);
    }, [protonTipsSnoozeTime]);

    const randomOption = useMemo(() => getRandomOption(), []);

    if (loadingChecklist) {
        return null;
    }

    if (showPlaceholder && canDisplayChecklist && displayState === CHECKLIST_DISPLAY_TYPE.FULL) {
        return <UsersOnboardingChecklist />;
    }

    if (showPlaceholder) {
        return (
            <>
                <PlaceholderView
                    welcomeFlag={welcomeFlag}
                    labelID={labelID}
                    checkedIDs={checkedIDs}
                    onCheckAll={handleCheckAll}
                />
                {protonTipsEnabled && shouldDisplayTips && tipMessages.length && (
                    <TipBox
                        data={randomOption}
                        updateLastSnoozeTime={update}
                        isDismissed={isTipDismissed}
                        setIsDismissed={setIsTipDismissed}
                    />
                )}
            </>
        );
    }

    return null;
};

export default MailboxContainerPlaceholder;
