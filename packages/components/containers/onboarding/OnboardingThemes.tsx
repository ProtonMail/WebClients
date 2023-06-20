import { c } from 'ttag';

import { ThemeTypes } from '@proton/shared/lib/themes/themes';

import ThemeCards, { Theme } from '../themes/ThemeCards';
import OnboardingContent, { Props as OnboardingContentProps } from './OnboardingContent';

interface Props extends Omit<OnboardingContentProps, 'decription' | 'onChange'> {
    maxContentHeight?: string;
    themes: Theme[];
    themeIdentifier: ThemeTypes;
    onChange: (identifier: ThemeTypes) => void;
}

const OnboardingThemes = ({ maxContentHeight, themes, themeIdentifier, onChange, ...rest }: Props) => {
    return (
        <OnboardingContent
            className="h-custom"
            style={{ '--h-custom': maxContentHeight ?? 'auto' }}
            title={c('Onboarding Proton').t`Pick a theme`}
            description={c('Onboarding Proton').t`You will be able to change your theme any time in your settings.`}
            {...rest}
        >
            <ThemeCards list={themes} themeIdentifier={themeIdentifier} onChange={onChange} size="onboarding" />
        </OnboardingContent>
    );
};

export default OnboardingThemes;
