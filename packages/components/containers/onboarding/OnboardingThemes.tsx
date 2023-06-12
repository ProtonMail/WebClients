import { c } from 'ttag';

import { ThemeTypes } from '@proton/shared/lib/themes/themes';

import ThemeCards, { Theme } from '../themes/ThemeCards';
import OnboardingContent, { Props as OnboardingContentProps } from './OnboardingContent';

interface Props extends Omit<OnboardingContentProps, 'decription' | 'onChange'> {
    themes: Theme[];
    themeIdentifier: ThemeTypes;
    onChange: (identifier: ThemeTypes) => void;
}

const OnboardingThemes = ({ themes, themeIdentifier, onChange, ...rest }: Props) => {
    return (
        <OnboardingContent
            title={c('Onboarding Proton').t`Select a theme`}
            description={c('Onboarding Proton')
                .t`More theming options are available in your account Settings > Appearance.`}
            {...rest}
        >
            <ThemeCards list={themes} themeIdentifier={themeIdentifier} onChange={onChange} size="large" />
        </OnboardingContent>
    );
};

export default OnboardingThemes;
