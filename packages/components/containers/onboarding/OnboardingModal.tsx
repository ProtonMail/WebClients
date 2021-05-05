import React, { useEffect, useState } from 'react';
import { c } from 'ttag';
import { useHistory, useLocation } from 'react-router';
import { updateAddress } from 'proton-shared/lib/api/addresses';
import { updateWelcomeFlags, updateThemeType } from 'proton-shared/lib/api/settings';
import { noop } from 'proton-shared/lib/helpers/function';
import { range } from 'proton-shared/lib/helpers/array';
import { PROTON_THEMES, ThemeTypes } from 'proton-shared/lib/themes/themes';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import { hasVisionary } from 'proton-shared/lib/helpers/subscription';

import { Icon, StepDots, StepDot, FormModal, Button, useSettingsLink } from '../../components';
import {
    useApi,
    useEventManager,
    useGetAddresses,
    useOrganization,
    useOrganizationKey,
    useSubscription,
    useUser,
    useWelcomeFlags,
} from '../../hooks';
import { OnboardingStepProps, OnboardingStepRenderCallback } from './interface';
import OnboardingSetDisplayName from './OnboardingSetDisplayName';
import OnboardingThemes from './OnboardingThemes';
import OnboardingStep from './OnboardingStep';
import OnboardingDiscoverApps from './OnboardingDiscoverApps';
import OnboardingWelcome from './OnboardingWelcome';
import OnboardingSetupOrganization from './OnboardingSetupOrganization';
import { getOrganizationKeyInfo } from '../organization/helpers/organizationKeysHelper';
import { useTheme } from '../themes/ThemeProvider';

const availableThemes = Object.values(PROTON_THEMES);

interface Props {
    title?: string;
    isLoading?: boolean;
    hasClose?: boolean;
    close?: React.ReactNode;
    submit?: string;
    onSubmit?: () => void;
    onClose?: () => void;
    onDone?: () => void;
    children?: ((props: OnboardingStepRenderCallback) => JSX.Element)[];
    setWelcomeFlags?: boolean;
    showGenericSteps?: boolean;
    allowClose?: boolean;
    hideDisplayName?: boolean;
}

const OnboardingModal = ({
    children,
    showGenericSteps,
    allowClose = false,
    setWelcomeFlags = true,
    hideDisplayName = false,
    onDone,
    ...rest
}: Props) => {
    const [user] = useUser();
    const history = useHistory();
    const location = useLocation();
    const goToSettings = useSettingsLink();
    const [organization, loadingOrganization] = useOrganization();
    const [subscription, loadingSubscription] = useSubscription();
    const [displayName, setDisplayName] = useState(user.DisplayName || user.Name || '');
    const [organizationKey, loadingOrganizationKey] = useOrganizationKey(organization);
    const { hasOrganizationKey } = getOrganizationKeyInfo(organizationKey);
    const [theme, setTheme] = useTheme();
    const getAddresses = useGetAddresses();
    const api = useApi();
    const { call } = useEventManager();
    const [welcomeFlags] = useWelcomeFlags();
    const canManageOrganization =
        !loadingOrganization &&
        !loadingSubscription &&
        !loadingOrganizationKey &&
        user.isAdmin &&
        organization.MaxMembers > 1 &&
        organization.UsedMembers === 1 &&
        !hasOrganizationKey &&
        !hasVisionary(subscription);
    const themes = availableThemes.map(({ identifier, getI18NLabel, src }) => {
        return { identifier, label: getI18NLabel(), src };
    });

    const handleUpdateWelcomeFlags = async () => {
        if (setWelcomeFlags) {
            return api(updateWelcomeFlags()).catch(noop);
        }
    };

    const [step, setStep] = useState(0);

    const handleNext = () => {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        if (isLastStep) {
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

    const handleSetDisplayNameNext = () => {
        const process = async () => {
            const addresses = await getAddresses();
            const firstAddress = addresses[0];
            // Should never happen.
            if (!firstAddress) {
                return;
            }
            await api(updateAddress(firstAddress.ID, { DisplayName: displayName, Signature: firstAddress.Signature }));
            await call();
        };
        void process();
        handleNext();
    };

    const welcomeStep = (
        <OnboardingStep submit={c('Action').t`Get started`} close={null} onSubmit={handleNext}>
            <OnboardingWelcome />
        </OnboardingStep>
    );

    const setDisplayNameStep = (
        <OnboardingStep submit={c('Action').t`Next`} close={null} onSubmit={handleSetDisplayNameNext}>
            <OnboardingSetDisplayName id="onboarding-0" displayName={displayName} setDisplayName={setDisplayName} />
        </OnboardingStep>
    );

    const setupOrganizationStep = (
        <OnboardingStep
            submit={c('Action').t`Start setup`}
            close={
                <Button size="large" color="norm" shape="ghost" className="mb1" fullWidth onClick={handleNext}>{c(
                    'Action'
                ).t`Skip`}</Button>
            }
            onSubmit={() => {
                goToSettings('/multi-user-support', undefined, true);
                handleNext();
            }}
        >
            <OnboardingSetupOrganization />
        </OnboardingStep>
    );

    const themesStep = (
        <OnboardingStep submit={c('Action').t`Next`} close={null} onSubmit={handleNext}>
            <OnboardingThemes themeIdentifier={theme} themes={themes} onChange={handleThemeChange} />
        </OnboardingStep>
    );

    const discoverAppsStep = (
        <OnboardingStep
            submit={children ? c('Action').t`Next` : c('Action').t`Done`}
            close={null}
            onSubmit={() => {
                void handleUpdateWelcomeFlags();
                handleNext();
            }}
        >
            <OnboardingDiscoverApps />
        </OnboardingStep>
    );

    const hasDisplayNameStep = welcomeFlags?.hasDisplayNameStep && !hideDisplayName;
    const displayGenericSteps = showGenericSteps || hasDisplayNameStep;
    const genericSteps = displayGenericSteps
        ? [
              welcomeStep,
              hasDisplayNameStep && setDisplayNameStep,
              canManageOrganization && setupOrganizationStep,
              themesStep,
              discoverAppsStep,
          ].filter(isTruthy)
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

    const steps = [...genericSteps, ...productSteps];
    const isLastStep = steps.length - 1 === step;
    const childStep = steps[step];
    const hasDots = steps.length > 1 && step < steps.length;
    const hasBack = step > 0;

    if (!steps.length) {
        rest?.onClose?.();
    }

    if (!React.isValidElement<OnboardingStepProps>(childStep)) {
        throw new Error('Missing step');
    }

    const childStepProps = childStep.props;

    useEffect(() => {
        // Once the modal is open, we clear the welcome URL parameter to avoid having this modal appearing after refresh or back history
        const queryParams = new URLSearchParams(location.search);

        if (queryParams.has('welcome')) {
            queryParams.delete('welcome');
            history.replace({
                search: queryParams.toString(),
            });
        }
    }, []);

    return (
        <FormModal
            {...rest}
            hasClose={allowClose}
            disableCloseOnOnEscape={allowClose}
            {...childStepProps}
            title={
                hasBack ? (
                    <span className="absolute top-left mt1 ml1">
                        <Button icon shape="ghost" title={c('Action').t`Back`} onClick={handleBack}>
                            <Icon name="arrow-left" alt={c('Action').t`Back`} />
                        </Button>
                    </span>
                ) : null
            }
            intermediate
            footer={null}
        >
            {childStep}
            <footer className="flex flex-nowrap flex-column">
                {typeof childStepProps.submit === 'string' ? (
                    <Button
                        shape="solid"
                        size="large"
                        color="norm"
                        fullWidth
                        loading={childStepProps.loading}
                        type="submit"
                        className="mb0-25"
                        data-focus-fallback={1}
                    >
                        {childStepProps.submit}
                    </Button>
                ) : (
                    childStepProps.submit
                )}

                {typeof childStepProps.close === 'string' ? (
                    <Button
                        shape="ghost"
                        size="large"
                        color="norm"
                        fullWidth
                        disabled={childStepProps.loading}
                        onClick={childStepProps.onClose || handleBack}
                    >
                        {childStepProps.close}
                    </Button>
                ) : (
                    childStepProps.close
                )}
            </footer>
            {hasDots ? (
                <div className="text-center">
                    <StepDots value={step}>
                        {range(0, steps.length).map((index) => (
                            <StepDot key={index} index={index} aria-controls={`onboarding-${index}`} />
                        ))}
                    </StepDots>
                </div>
            ) : (
                <div className="pt1 pb1" />
            )}
        </FormModal>
    );
};

export default OnboardingModal;
