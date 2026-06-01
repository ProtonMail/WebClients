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
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import type { MailSettings } from '@proton/shared/lib/interfaces/MailSettings';

export const CategoriesVisionaryOnboardingModal = () => {
    const api = useApi();
    const dispatch = useDispatch();

    const [loadingSkipCategories, withLoadingSkipCategories] = useLoading();
    const [loadingEnableCategories, withLoadingEnableCategories] = useLoading();

    const [mailSettings, mailSettingsLoading] = useMailSettings();
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

    const handleEnableCategories = async () => {
        void visionaryOnboardingFlag.update(true);

        if (!mailSettings.MailCategoryView) {
            const response = await api<{ MailSettings: MailSettings }>(updateMailCategoryView(true));
            dispatch(mailSettingsActions.updateMailSettings(response.MailSettings));
        }

        setModalState(false);
    };

    const handleSkipForNow = async () => {
        void visionaryOnboardingFlag.update(true);

        if (mailSettings.MailCategoryView) {
            const response = await api<{ MailSettings: MailSettings }>(updateMailCategoryView(false));
            dispatch(mailSettingsActions.updateMailSettings(response.MailSettings));
        }

        setModalState(false);
    };

    return renderModal ? (
        <Prompt
            {...modalProps}
            disableCloseOnEscape
            disableCloseWhenClickOutside
            title={c('Title').t`Help shape the future of email categories in ${MAIL_APP_NAME}`}
            buttons={[
                <Button
                    onClick={() => withLoadingEnableCategories(handleEnableCategories)}
                    loading={loadingEnableCategories}
                    color="norm"
                >{c('Action').t`Start testing`}</Button>,
                <Button onClick={() => withLoadingSkipCategories(handleSkipForNow)} loading={loadingSkipCategories}>{c(
                    'Action'
                ).t`Not now`}</Button>,
            ]}
        >
            <p>{c('Description')
                .t`If a message appears in the wrong category, simply move it to the right one. Right-click a message to choose a new category, or drag and drop it where it belongs.`}</p>
            <p>{c('Description')
                .t`You’re among the first to try our new category view before it launches. Your feedback will help improve how Proton Mail sorts emails for everyone.`}</p>
        </Prompt>
    ) : null;
};
