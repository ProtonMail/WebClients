import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import type { ThemeTypes } from '@proton/shared/lib/themes/themes';

import ThemeCards from '../themes/ThemeCards';
import { useTheme } from '../themes/ThemeProvider';
import OnboardingContent from './OnboardingContent';
import OnboardingStep from './OnboardingStep';
import { ONBOARDING_THEMES } from './constants';
import type { OnboardingStepRenderCallback } from './interface';

interface Props extends OnboardingStepRenderCallback {}

const OnboardingThemes = ({ ...rest }: Props) => {
    const mobile = isMobile();
    const theme = useTheme();

    const handleThemeChange = (newThemeType: ThemeTypes) => {
        theme.setTheme(newThemeType);
    };

    return (
        <OnboardingStep>
            <OnboardingContent
                title={c('Onboarding Proton').t`Pick a theme`}
                description={c('Onboarding Proton').t`You will be able to change your theme any time in your settings.`}
                {...rest}
            >
                <ThemeCards
                    list={ONBOARDING_THEMES}
                    themeIdentifier={theme.information.theme}
                    onChange={handleThemeChange}
                    size={mobile ? 'medium-wide' : 'large'}
                />
            </OnboardingContent>
            <footer className="flex flex-nowrap">
                <Button size="large" fullWidth onClick={rest.onNext}>
                    {c('Action').t`Next`}
                </Button>
            </footer>
        </OnboardingStep>
    );
};

export default OnboardingThemes;
