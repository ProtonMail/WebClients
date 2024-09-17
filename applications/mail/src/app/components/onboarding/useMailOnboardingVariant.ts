import useFlag from '@proton/unleash/useFlag';
import useVariant from '@proton/unleash/useVariant';

/**
 * @returns The name of the MailOnboarding variant.
 * Defaults to 'old' variant if no variant name found.
 */
const useMailOnboardingVariant = () => {
    const isMailOnboardingEnabled = useFlag('MailOnboarding');
    const variant = useVariant('MailOnboarding');
    const variantName = variant?.name === 'disabled' ? 'old' : variant?.name || 'old';

    return { variant: variantName, isEnabled: isMailOnboardingEnabled };
};

export default useMailOnboardingVariant;
