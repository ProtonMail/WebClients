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
        if (hasSeenOnboarding || mailSettingsLoading || !hasBetaFlag) {
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
            title={c('Title').t`Early access: Email Categories`}
            buttons={[
                <Button onClick={handleEnableCategories} color="norm">{c('Action').t`Enable categories`}</Button>,
                <Button onClick={() => withLoading(handleSkipForNow)} loading={loading}>{c('Action')
                    .t`Skip for now`}</Button>,
            ]}
        >
            <p>As a Visionary, you get first dibs on new features, even the ones still in the oven. 🔥</p>
            <p>
                Email categories automatically organizes your inbox into smart groups. Try it out and tell us what you
                think.
            </p>
            <p>Heads up: This feature is still in beta, you might run into a rough edge or two!</p>
        </Prompt>
    ) : null;
};
