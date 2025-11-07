import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ONBOARDING_THEMES } from '@proton/components/containers/onboarding/constants';
import { useTheme } from '@proton/components/containers/themes/ThemeProvider';
import { getWelcomeToText } from '@proton/shared/lib/apps/text';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import type { ThemeTypes } from '@proton/shared/lib/themes/constants';

import { Container } from '../Container';
import { ThemePicker } from '../ThemePicker';
import type { OnboardingProps } from '../interface';

export const ThemeStep = () => {
    const theme = useTheme();

    const handleThemeChange = (newThemeType: ThemeTypes) => {
        theme.setTheme(newThemeType);
    };

    return (
        <Container
            title={c('Onboarding Info').t`Choose your favorite theme`}
            subtitle={getWelcomeToText(DRIVE_APP_NAME)}
            rightContent={
                <ThemePicker
                    list={ONBOARDING_THEMES}
                    themeIdentifier={theme.information.theme}
                    onChange={handleThemeChange}
                />
            }
        >
            <p>
                {c('Onboarding Info')
                    .t`Do you prefer ${DRIVE_APP_NAME} in light or dark mode? Select the color that inspires you the most.`}
            </p>
        </Container>
    );
};

export const ThemeStepButtons = ({ onNext }: OnboardingProps) => {
    return (
        <div className="w-full flex justify-end">
            <Button size="large" color="norm" onClick={onNext}>
                {c('Onboarding Action').t`Select theme`}
            </Button>
        </div>
    );
};
