import { isValidElement, useState } from 'react';
import { c } from 'ttag';
import { updateWelcomeFlags, updateThemeType, updateFlags } from '@proton/shared/lib/api/settings';
import noop from '@proton/util/noop';
import range from '@proton/util/range';
import { PROTON_THEMES, ThemeTypes } from '@proton/shared/lib/themes/themes';
import isTruthy from '@proton/util/isTruthy';
import { hasNewVisionary, hasVisionary } from '@proton/shared/lib/helpers/subscription';

import {
    StepDots,
    StepDot,
    Button,
    useSettingsLink,
    ModalTwo,
    ModalTwoContent as ModalContent,
} from '../../components';
import { useApi, useOrganization, useSubscription, useUser, useUserSettings, useWelcomeFlags } from '../../hooks';
import { OnboardingStepProps, OnboardingStepRenderCallback } from './interface';
import OnboardingThemes from './OnboardingThemes';
import OnboardingStep from './OnboardingStep';
import OnboardingDiscoverApps from './OnboardingDiscoverApps';
import OnboardingSetupOrganization from './OnboardingSetupOrganization';
import { useTheme } from '../themes/ThemeProvider';

import './OnboardingModal.scss';

interface Props {
    onClose?: () => void;
    onDone?: () => void;
    children?: ((props: OnboardingStepRenderCallback) => JSX.Element)[];
    showGenericSteps?: boolean;
}

const OnboardingModal = ({ children, showGenericSteps, onDone, ...rest }: Props) => {
    const [user] = useUser();
    const [userSettings] = useUserSettings();
    const goToSettings = useSettingsLink();
    const [organization, loadingOrganization] = useOrganization();
    const [subscription, loadingSubscription] = useSubscription();
    const [theme, setTheme] = useTheme();
    const api = useApi();
    const [welcomeFlags] = useWelcomeFlags();
    let isLastStep = false;
    const canSetupOrganization =
        !loadingOrganization &&
        !loadingSubscription &&
        user.isAdmin &&
        organization.MaxMembers > 1 &&
        organization.UsedMembers === 1 &&
        !organization.HasKeys &&
        !hasNewVisionary(subscription) &&
        !hasVisionary(subscription);

    const [step, setStep] = useState(0);

    const handleNext = () => {
        if (isLastStep) {
            if (welcomeFlags.isWelcomeFlow) {
                // Set generic welcome to true
                api(updateFlags({ Welcomed: 1 })).catch(noop);
            }
            if (!userSettings.WelcomeFlag) {
                // Set product specific welcome to true
                api(updateWelcomeFlags()).catch(noop);
            }
            onDone?.();
            rest?.onClose?.();
            return;
        }
        setStep((step) => step + 1);
    };

    const handleBack = () => {
        setStep((step) => step - 1);
    };

    const handleThemeChange = async (newThemeType: ThemeTypes) => {
        setTheme(newThemeType);
        await api(updateThemeType(newThemeType));
    };

    const setupOrganizationStep = (
        <OnboardingStep>
            <OnboardingSetupOrganization />
            <footer>
                <div className="flex flex-nowrap mb1">
                    <Button size="large" color="weak" className="mr1" fullWidth onClick={handleBack}>{c('Action')
                        .t`Back`}</Button>
                    <Button
                        size="large"
                        color="norm"
                        fullWidth
                        onClick={() => {
                            goToSettings('/multi-user-support', undefined, true);
                            handleNext();
                        }}
                    >
                        {c('Action').t`Start setup`}
                    </Button>
                </div>
                <Button size="large" color="norm" shape="ghost" className="mb1" fullWidth onClick={handleNext}>{c(
                    'Action'
                ).t`Skip`}</Button>
            </footer>
        </OnboardingStep>
    );

    const themesStep = (
        <OnboardingStep>
            <OnboardingThemes themeIdentifier={theme} themes={PROTON_THEMES} onChange={handleThemeChange} />
            <footer className="flex flex-nowrap">
                <Button size="large" color="weak" className="mr1" fullWidth onClick={handleBack}>{c('Action')
                    .t`Back`}</Button>
                <Button size="large" color="norm" fullWidth onClick={handleNext}>
                    {c('Action').t`Next`}
                </Button>
            </footer>
        </OnboardingStep>
    );

    const discoverAppsStep = (
        <OnboardingStep>
            <OnboardingDiscoverApps />
            <footer className="flex flex-nowrap">
                <Button size="large" className="mr1" fullWidth onClick={handleBack}>{c('Action').t`Back`}</Button>
                <Button size="large" color="norm" fullWidth onClick={handleNext}>
                    {c('Action').t`Get started`}
                </Button>
            </footer>
        </OnboardingStep>
    );

    const displayGenericSteps = welcomeFlags?.hasGenericWelcomeStep || showGenericSteps;
    const genericSteps = displayGenericSteps
        ? [canSetupOrganization && setupOrganizationStep, themesStep, discoverAppsStep].filter(isTruthy)
        : [];

    const productSteps = children
        ? (Array.isArray(children) ? children : [children])
              .map(
                  (renderCallback) =>
                      renderCallback?.({
                          onNext: handleNext,
                          onBack: handleBack,
                          displayGenericSteps,
                      }) ?? null
              )
              .filter((x) => x !== null)
        : [];

    const steps = [...productSteps, ...genericSteps];
    isLastStep = steps.length - 1 === step;
    const childStep = steps[step];
    const hasDots = steps.length > 1 && step < steps.length;

    if (!steps.length) {
        rest?.onClose?.();
    }

    if (!isValidElement<OnboardingStepProps>(childStep)) {
        throw new Error('Missing step');
    }

    return (
        <ModalTwo {...rest} size="small" className="onboarding-modal">
            <ModalContent className="m2">
                {childStep}
                {hasDots ? (
                    <div className="text-center">
                        <StepDots value={step} ulClassName="mb0">
                            {range(0, steps.length).map((index) => (
                                <StepDot
                                    key={index}
                                    index={index}
                                    aria-controls={`onboarding-${index}`}
                                    onClick={() => {
                                        setStep(index);
                                    }}
                                />
                            ))}
                        </StepDots>
                    </div>
                ) : null}
            </ModalContent>
        </ModalTwo>
    );
};

export default OnboardingModal;
