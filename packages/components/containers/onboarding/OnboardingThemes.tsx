import { c } from 'ttag';
import { ThemeTypes } from '@proton/shared/lib/themes/themes';

import OnboardingContent, { Props as OnboardingContentProps } from './OnboardingContent';
import ThemeCards, { Theme } from '../themes/ThemeCards';

interface Props extends Omit<OnboardingContentProps, 'decription' | 'onChange'> {
    themes: Theme[];
    themeIdentifier: ThemeTypes;
    onChange: (identifier: ThemeTypes) => void;
}

const OnboardingThemes = ({ themes, themeIdentifier, onChange, ...rest }: Props) => {
    return (
        <OnboardingContent
            title={c('Onboarding Proton').t`Select a theme`}
            description={c('Onboarding Proton').t`You can change this anytime in your settings.`}
            {...rest}
        >
            <ThemeCards
                className="theme-modal-list"
                list={themes}
                size="small"
                themeIdentifier={themeIdentifier}
                onChange={onChange}
            />
        </OnboardingContent>
    );
};

export default OnboardingThemes;
