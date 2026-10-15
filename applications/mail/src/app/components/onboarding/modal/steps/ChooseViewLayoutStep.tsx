import { useState } from 'react';

import { c } from 'ttag';

import { useWelcomeFlags } from '@proton/account/welcomeFlags';
import { Button } from '@proton/atoms/Button/Button';
import ViewLayoutCards from '@proton/components/containers/layouts/ViewLayoutCards';
import useUpdateViewLayout from '@proton/components/containers/layouts/useUpdateViewLayout';
import OnboardingStep from '@proton/components/containers/onboarding/OnboardingStep';
import type { OnboardingStepRenderCallback } from '@proton/components/containers/onboarding/interface';
import useLoading from '@proton/hooks/useLoading';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { SentryMailInitiatives, traceInitiativeError } from '@proton/shared/lib/helpers/sentry';
import { VIEW_LAYOUT } from '@proton/shared/lib/mail/mailSettings';
import inboxColumnSvg from '@proton/styles/assets/img/layout/layout-thumb-inbox-column.svg';
import inboxRowSvg from '@proton/styles/assets/img/layout/layout-thumb-inbox-row.svg';
import { MailFeatureFlag } from '@proton/unleash/Flags';

import { TrackOnboardingStepLoad } from '../../../../telemetry/TrackOnboardingStepLoad';
import { ONBOARDING_ACTIONS, ONBOARDING_STEPS, useOnboardingTracking } from '../../../../telemetry/onboardingEvents';
import type { OnboardingStepEligibleCallback } from '../interface';
import OnboardingContent from '../layout/OnboardingContent';

/**
 * Gated on the experiment flag the API uses to record the A/B assignment at signup: a plain on/off flag
 * (50% `userId` rollout), evaluated with the same user id on both sides, so the step is shown exactly to the
 * users the API records as `active`.
 */
export const isChooseViewLayoutStepEligible: OnboardingStepEligibleCallback = async (dispatch) => {
    const canDisplay = dispatch((_dispatch, _getState, extra) =>
        extra.unleashClient?.isEnabled(MailFeatureFlag.WebMailOnboardingViewExperiment)
    );

    return {
        canDisplay: canDisplay ?? false,
        preload: [inboxColumnSvg, inboxRowSvg],
    };
};

const ChooseViewLayoutStep = ({ onNext }: OnboardingStepRenderCallback) => {
    const [{ ViewLayout }, loadingMailSettings] = useMailSettings();
    const updateViewLayout = useUpdateViewLayout();
    const { trackStepInteracted, trackViewLayoutStepCompleted } = useOnboardingTracking();
    const { welcomeFlags } = useWelcomeFlags();
    // Read once: the flag flips back when the modal closes
    const [isReplay] = useState(welcomeFlags.isReplay);
    const [saving, withSaving] = useLoading();

    // Kept locally until Next: pre-selects the user's current layout (ROW for new users, their own choice on replay)
    const [selected, setSelected] = useState<VIEW_LAYOUT>();
    const viewLayout = selected ?? ViewLayout;

    const handleChange = (layout: VIEW_LAYOUT) => {
        if (layout === viewLayout) {
            return;
        }
        setSelected(layout);
        trackStepInteracted(ONBOARDING_STEPS.viewLayout, ONBOARDING_ACTIONS.selectViewLayout);
    };

    // The choice is always saved on Next, even when it is the default, so the API records one
    // `layout_choice` per user. Replays are not part of the experiment, so they save without the source.
    const handleNext = async () => {
        trackViewLayoutStepCompleted(viewLayout === VIEW_LAYOUT.COLUMN ? 'column' : 'row');

        try {
            await updateViewLayout(viewLayout, isReplay ? undefined : 'onboarding');
        } catch (error) {
            // Never block onboarding on a failed preference save.
            traceInitiativeError(SentryMailInitiatives.MAIL_ONBOARDING, error);
        }

        onNext();
    };

    return (
        <OnboardingStep>
            <TrackOnboardingStepLoad step={ONBOARDING_STEPS.viewLayout} />
            <OnboardingContent
                title={c('Onboarding modal').t`Choose your inbox layout`}
                description={
                    <span id="onboarding-view-layout-desc">
                        {c('Onboarding modal').t`You can change this anytime in settings.`}
                    </span>
                }
                titleBlockClassName="mb-8"
            >
                <ViewLayoutCards
                    className="justify-center"
                    describedByID="onboarding-view-layout-desc"
                    viewLayout={viewLayout}
                    onChange={handleChange}
                    loading={saving || loadingMailSettings}
                />

                <footer className="pt-6">
                    <Button
                        size="large"
                        color="norm"
                        fullWidth
                        loading={saving}
                        disabled={loadingMailSettings}
                        onClick={() => withSaving(handleNext())}
                    >
                        {c('Onboarding modal').t`Next`}
                    </Button>
                </footer>
            </OnboardingContent>
        </OnboardingStep>
    );
};

export default ChooseViewLayoutStep;
