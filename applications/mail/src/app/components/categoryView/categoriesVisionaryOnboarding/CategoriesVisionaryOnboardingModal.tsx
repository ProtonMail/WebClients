import { useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Prompt from '@proton/components/components/prompt/Prompt';
import useApi from '@proton/components/hooks/useApi';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import useLoading from '@proton/hooks/useLoading';
import { mailSettingsActions } from '@proton/mail/store/mailSettings';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { updateMailCategoryView } from '@proton/shared/lib/api/mailSettings';
import { domIsBusy } from '@proton/shared/lib/busy/busy';
import type { MailSettings } from '@proton/shared/lib/interfaces/MailSettings';

export const CategoriesVisionaryOnboardingModal = () => {
    const api = useApi();
    const dispatch = useDispatch();

    const [loading, withLoading] = useLoading();
    const [, mailSettingsLoading] = useMailSettings();
    const [modalProps, setModalState, renderModal] = useModalState();

    const betaFlag = useFeature<boolean>(FeatureCode.CategoryViewBeta);
    const hasBetaFlag = betaFlag.feature?.Value;

    const visionaryOnboardingFlag = useFeature<boolean>(FeatureCode.CategoryViewVisionaryOnboarding);
    const hasSeenOnboarding = visionaryOnboardingFlag.feature?.Value;

    useEffect(() => {
        const isDomBusy = domIsBusy();
        if (hasSeenOnboarding || mailSettingsLoading || !hasBetaFlag || isDomBusy) {
            return;
        }

        setModalState(true);
    }, [hasSeenOnboarding, hasBetaFlag, setModalState, mailSettingsLoading]);

    const handleEnableCategories = () => {
        void visionaryOnboardingFlag.update(true);
        setModalState(false);
    };

    const handleSkipForNow = async () => {
        void visionaryOnboardingFlag.update(true);

        const response = await api<{ MailSettings: MailSettings }>(updateMailCategoryView(false));
        dispatch(mailSettingsActions.updateMailSettings(response.MailSettings));

        setModalState(false);
    };

    return renderModal ? (
        <Prompt
            {...modalProps}
            disableCloseOnEscape
            disableCloseWhenClickOutside
            title={c('Title').t`Early access to email categories`}
            buttons={[
                <Button onClick={handleEnableCategories} color="norm">{c('Action').t`Start testing`}</Button>,
                <Button onClick={() => withLoading(handleSkipForNow)} loading={loading}>{c('Action')
                    .t`Not now`}</Button>,
            ]}
        >
            <p>{c('Description')
                .t`Thank you for opting in. As a Visionary user, you’re among the first to try email categories.`}</p>
            <p>{c('Description').t`To send feedback, simply correct any email that landed in the wrong category.`}</p>
            <p>{c('Description')
                .t`You might notice a few quirks and inaccuracies while the feature is still evolving, but every correction you make counts.`}</p>
        </Prompt>
    ) : null;
};
