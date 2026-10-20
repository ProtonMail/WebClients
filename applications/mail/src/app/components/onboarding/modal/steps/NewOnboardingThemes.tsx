import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import OnboardingStep from '@proton/components/containers/onboarding/OnboardingStep';
import { ONBOARDING_THEMES } from '@proton/components/containers/onboarding/constants';
import type { OnboardingStepRenderCallback } from '@proton/components/containers/onboarding/interface';
import ThemeCard from '@proton/components/containers/themes/ThemeCard';
import { getThemeCardSize } from '@proton/components/containers/themes/ThemeCards';
import { useTheme } from '@proton/components/containers/themes/ThemeProvider';
import { OldTelemetryMailOnboardingEvents } from '@proton/shared/lib/api/telemetry';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import type { ThemeTypes } from '@proton/shared/lib/themes/constants';
import clsx from '@proton/utils/clsx';

import { TrackOnboardingStepLoad } from '../../../../telemetry/TrackOnboardingStepLoad';
import { ONBOARDING_ACTIONS, ONBOARDING_STEPS, useOnboardingTracking } from '../../../../telemetry/onboardingEvents';
import { useMailOnboardingTelemetry } from '../../useMailOnboardingTelemetry';
import type { OnboardingStepEligibleCallback } from '../interface';
import OnboardingContent from '../layout/OnboardingContent';

export const isNewOnboardingThemesStepEligible: OnboardingStepEligibleCallback = async () => ({
    canDisplay: true,
});

const NewOnboardingThemes = ({ onNext }: OnboardingStepRenderCallback) => {
    const { trackStepInteracted, trackThemeStepCompleted } = useOnboardingTracking();
    const sendMailOnboardingTelemetry = useMailOnboardingTelemetry();
    const mobile = isMobile();
    const theme = useTheme();
    const largeSizeProps = getThemeCardSize('large');
    const mediumSizeProps = getThemeCardSize('medium');
    const sizeProps = mobile ? mediumSizeProps : largeSizeProps;

    const handleThemeChange = (newThemeType: ThemeTypes) => {
        theme.setTheme(newThemeType);
        trackStepInteracted(ONBOARDING_STEPS.themeSelection, ONBOARDING_ACTIONS.selectTheme);
    };

    const handleNext = () => {
        const selectedTheme = theme.information.theme;
        void sendMailOnboardingTelemetry(OldTelemetryMailOnboardingEvents.select_theme, {
            theme: `${selectedTheme}`,
            is_default_theme: selectedTheme === 0 ? 'yes' : 'no',
        });

        trackThemeStepCompleted(theme.information.label);

        onNext();
    };

    return (
        <OnboardingStep>
            <TrackOnboardingStepLoad step={ONBOARDING_STEPS.themeSelection} />
            <OnboardingContent
                title={c('Onboarding Proton').t`Make it your own`}
                description={c('Onboarding Proton').t`Choose your preferred look and feel.`}
                titleBlockClassName="mb-6"
                className="mb-12"
            >
                <ul
                    className={clsx('unstyled m-0 grid-auto-fill', `gap-${sizeProps.gridGap}`)}
                    style={{
                        '--min-grid-template-column-size': `${sizeProps.minGridTemplateColumnSize}rem`,
                        columnGap: 'var(--space-6)',
                    }}
                >
                    {ONBOARDING_THEMES.map(({ identifier, label, thumbColors }) => {
                        const id = `id_${identifier}`;
                        return (
                            <li key={label}>
                                <ThemeCard
                                    label={label}
                                    id={id}
                                    shapeButton="ghost"
                                    colors={thumbColors}
                                    selected={theme.information.theme === identifier}
                                    onChange={() => handleThemeChange(identifier)}
                                    data-testid={`theme-card:theme-${label}`}
                                />
                            </li>
                        );
                    })}
                </ul>
            </OnboardingContent>
            <footer>
                <Button size="large" fullWidth color="norm" onClick={handleNext}>
                    {c('Action').t`Use this`}
                </Button>
            </footer>
        </OnboardingStep>
    );
};

export default NewOnboardingThemes;
