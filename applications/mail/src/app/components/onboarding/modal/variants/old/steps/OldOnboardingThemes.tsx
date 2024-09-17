import { c } from 'ttag';

import { Button } from '@proton/atoms';
import OnboardingContent from '@proton/components/containers/onboarding/OnboardingContent';
import OnboardingStep from '@proton/components/containers/onboarding/OnboardingStep';
import { ONBOARDING_THEMES } from '@proton/components/containers/onboarding/constants';
import type { OnboardingStepRenderCallback } from '@proton/components/containers/onboarding/interface';
import ThemeCards from '@proton/components/containers/themes/ThemeCards';
import { useTheme } from '@proton/components/containers/themes/ThemeProvider';
import { TelemetryMailOnboardingEvents } from '@proton/shared/lib/api/telemetry';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import type { ThemeTypes } from '@proton/shared/lib/themes/themes';

import { useMailOnboardingTelemetry } from 'proton-mail/components/onboarding/useMailOnboardingTelemetry';

const OldOnboardingThemes = ({ onNext }: OnboardingStepRenderCallback) => {
    const [sendMailOnboardingTelemetry] = useMailOnboardingTelemetry();
    const mobile = isMobile();
    const theme = useTheme();

    const handleThemeChange = (newThemeType: ThemeTypes) => {
        void sendMailOnboardingTelemetry(TelemetryMailOnboardingEvents.select_theme, {
            theme: `${newThemeType}`,
            is_default_theme: newThemeType === 0 ? 'yes' : 'no',
        });
        theme.setTheme(newThemeType);
    };

    return (
        <OnboardingStep>
            <OnboardingContent
                title={c('Onboarding Proton').t`Pick a theme`}
                description={c('Onboarding Proton').t`You will be able to change your theme any time in your settings.`}
            >
                <ThemeCards
                    list={ONBOARDING_THEMES}
                    themeIdentifier={theme.information.theme}
                    onChange={handleThemeChange}
                    size={mobile ? 'medium-wide' : 'large'}
                />
            </OnboardingContent>
            <footer className="flex flex-nowrap">
                <Button size="large" fullWidth onClick={onNext}>
                    {c('Action').t`Next`}
                </Button>
            </footer>
        </OnboardingStep>
    );
};

export default OldOnboardingThemes;
