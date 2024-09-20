import { c } from 'ttag';

import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import onboardingDisplayName from '@proton/styles/assets/img/onboarding/display-name.svg';

import type { Props as OnboardingContentProps } from './OnboardingContent';
import OnboardingContent from './OnboardingContent';

interface Props extends Omit<OnboardingContentProps, 'img' | 'text' | 'description'> {
    displayName: string;
    setDisplayName: (displayName: string) => void;
    displayNameError?: string;
}

const OnboardingSetDisplayName = ({ displayName, setDisplayName, displayNameError, ...rest }: Props) => {
    return (
        <OnboardingContent
            description={c('Onboarding Proton')
                .t`This is what people will see when you send them an email, invite them to an event, or share a file with them.`}
            img={<img src={onboardingDisplayName} alt={c('Onboarding Proton').t`Choose a display name`} />}
            title={c('Onboarding Proton').t`Choose a display name`}
            {...rest}
        >
            <InputFieldTwo
                id="displayName"
                label={c('Label').t`Display name`}
                autoFocus
                placeholder={c('Placeholder').t`e.g. Julia Smith`}
                value={displayName}
                onValue={setDisplayName}
                error={displayNameError}
            />
        </OnboardingContent>
    );
};

export default OnboardingSetDisplayName;
