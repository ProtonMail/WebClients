import { c } from 'ttag';

import { isMobile } from '@proton/shared/lib/helpers/browser';
import type { ThemeTypes } from '@proton/shared/lib/themes/themes';

import type { Theme } from '../themes/ThemeCards';
import ThemeCards from '../themes/ThemeCards';
import type { Props as OnboardingContentProps } from './OnboardingContent';
import OnboardingContent from './OnboardingContent';

interface Props extends Omit<OnboardingContentProps, 'decription' | 'onChange'> {
    themes: Theme[];
    themeIdentifier: ThemeTypes;
    onChange: (identifier: ThemeTypes) => void;
}

const OnboardingThemes = ({ themes, themeIdentifier, onChange, ...rest }: Props) => {
    const mobile = isMobile();

    return (
        <OnboardingContent
            title={c('Onboarding Proton').t`Pick a theme`}
            description={c('Onboarding Proton').t`You will be able to change your theme any time in your settings.`}
            {...rest}
        >
            <ThemeCards
                list={themes}
                themeIdentifier={themeIdentifier}
                onChange={onChange}
                size={mobile ? 'medium-wide' : 'large'}
            />
        </OnboardingContent>
    );
};

export default OnboardingThemes;
