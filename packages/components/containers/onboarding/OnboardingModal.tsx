import { ReactNode, isValidElement, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { updateFlags, updateWelcomeFlags } from '@proton/shared/lib/api/settings';
import { hasNewVisionary, hasVisionary } from '@proton/shared/lib/helpers/subscription';
import { PROTON_THEMES_MAP, ThemeTypes } from '@proton/shared/lib/themes/themes';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';
import range from '@proton/utils/range';

import { ModalTwoContent as ModalContent, ModalSize, ModalTwo, StepDot, StepDots } from '../../components';
import { useApi, useOrganization, useSubscription, useUser, useUserSettings, useWelcomeFlags } from '../../hooks';
import { useTheme } from '../themes/ThemeProvider';
import OnboardingDiscoverApps from './OnboardingDiscoverApps';
import OnboardingSetupOrganization from './OnboardingSetupOrganization';
import OnboardingStep from './OnboardingStep';
import OnboardingThemes from './OnboardingThemes';
import { OnboardingStepProps, OnboardingStepRenderCallback } from './interface';

import './OnboardingModal.scss';

interface Props {
    maxContentHeight?: string;
    size?: ModalSize;
    onClose?: () => void;
    onExit?: () => void;
    onDone?: () => void;
    children?: ((props: OnboardingStepRenderCallback) => ReactNode)[];
    hideDiscoverApps?: boolean;
    showGenericSteps?: boolean;
    extraProductStep?: ((props: OnboardingStepRenderCallback) => ReactNode)[];
}

const OnboardingModal = ({
    children,
    size = 'small',
    hideDiscoverApps = false,
    showGenericSteps,
    onDone,
    maxContentHeight,
    extraProductStep,
    ...rest
}: Props) => {
    const [user] = useUser();
    const [userSettings] = useUserSettings();
    const [organization, loadingOrganization] = useOrganization();
    const [subscription, loadingSubscription] = useSubscription();
    const theme = useTheme();
    const onboardingThemesSelection = [
        ThemeTypes.Duotone,
        ThemeTypes.Carbon,
        ThemeTypes.Monokai,
        ThemeTypes.Snow,
        ThemeTypes.ContrastLight,
        ThemeTypes.Classic,
    ].map((id) => PROTON_THEMES_MAP[id]);
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

    const handleThemeChange = (newThemeType: ThemeTypes) => {
        theme.setTheme(newThemeType);
    };

    const setupOrganizationStep = (
        <OnboardingStep>
            <OnboardingSetupOrganization maxContentHeight={maxContentHeight} handleNext={handleNext} />
            <footer>
                <footer className="flex flex-nowrap">
                    <Button size="large" fullWidth onClick={handleNext}>
                        {c('Action').t`Skip`}
                    </Button>
                </footer>
            </footer>
        </OnboardingStep>
    );

    const themesStep = (
        <OnboardingStep>
            <OnboardingThemes
                maxContentHeight={maxContentHeight}
                themeIdentifier={theme.information.theme}
                themes={onboardingThemesSelection}
                onChange={handleThemeChange}
            />
            <footer className="flex flex-nowrap">
                <Button size="large" fullWidth onClick={handleNext}>
                    {c('Action').t`Next`}
                </Button>
            </footer>
        </OnboardingStep>
    );

    const discoverAppsStep = (
        <OnboardingStep>
            <OnboardingDiscoverApps maxContentHeight={maxContentHeight} />
            <footer className="flex flex-nowrap">
                <Button size="large" className="mr-4" fullWidth onClick={handleBack}>{c('Action').t`Back`}</Button>
                <Button size="large" color="norm" fullWidth onClick={handleNext}>
                    {c('Action').t`Get started`}
                </Button>
            </footer>
        </OnboardingStep>
    );

    const displayGenericSteps = welcomeFlags?.hasGenericWelcomeStep || showGenericSteps;
    const genericSteps = displayGenericSteps
        ? [themesStep, canSetupOrganization && setupOrganizationStep, !hideDiscoverApps && discoverAppsStep].filter(
              isTruthy
          )
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

    const extraSteps = extraProductStep
        ? (Array.isArray(extraProductStep) ? extraProductStep : [extraProductStep])
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

    const steps = [...productSteps, ...genericSteps, ...extraSteps];
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
        <ModalTwo {...rest} size={size} className="onboarding-modal">
            <ModalContent className="m-8">
                {childStep}
                {hasDots ? (
                    <div className="text-center">
                        <StepDots value={step} ulClassName="mb-0">
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
