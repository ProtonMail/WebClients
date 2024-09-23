import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    ONBOARDING_THEMES,
    OnboardingStep,
    type OnboardingStepRenderCallback,
    ThemeCard,
    useTheme,
} from '@proton/components';
import { getThemeCardSize } from '@proton/components/containers/themes/ThemeCards';
import { TelemetryMailOnboardingEvents } from '@proton/shared/lib/api/telemetry';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import type { ThemeTypes } from '@proton/shared/lib/themes/themes';
import clsx from '@proton/utils/clsx';

import { useMailOnboardingTelemetry } from 'proton-mail/components/onboarding/useMailOnboardingTelemetry';

import NewOnboardingContent from '../layout/NewOnboardingContent';

const NewOnboardingThemes = ({ onNext }: OnboardingStepRenderCallback) => {
    const [sendMailOnboardingTelemetry] = useMailOnboardingTelemetry();
    const mobile = isMobile();
    const theme = useTheme();
    const largeSizeProps = getThemeCardSize('large');
    const mediumSizeProps = getThemeCardSize('medium');
    const sizeProps = mobile ? mediumSizeProps : largeSizeProps;

    const handleThemeChange = (newThemeType: ThemeTypes) => {
        theme.setTheme(newThemeType);
    };

    const handleNext = () => {
        const selectedTheme = theme.information.theme;
        void sendMailOnboardingTelemetry(TelemetryMailOnboardingEvents.select_theme, {
            theme: `${selectedTheme}`,
            is_default_theme: selectedTheme === 0 ? 'yes' : 'no',
        });

        onNext();
    };

    return (
        <OnboardingStep>
            <NewOnboardingContent
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
            </NewOnboardingContent>
            <footer>
                <Button size="large" fullWidth color="norm" onClick={handleNext}>
                    {c('Action').t`Use this`}
                </Button>
            </footer>
        </OnboardingStep>
    );
};

export default NewOnboardingThemes;
