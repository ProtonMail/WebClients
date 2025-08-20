import { useState } from 'react';

import { c } from 'ttag';

import { memberThunk, organizationThunk, subscriptionThunk, useUserSettings, userThunk } from '@proton/account';
import { useAddresses } from '@proton/account/addresses/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms';
import {
    LabelStack,
    Loader,
    OnboardingStep,
    type OnboardingStepRenderCallback,
    Toggle,
    useActiveBreakpoint,
    useApi,
    useEventManager,
    useShortDomainAddress,
} from '@proton/components';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { PLANS } from '@proton/payments';
import { getIsB2BAudienceFromPlan, getIsB2BAudienceFromSubscription, hasVisionary, isTrial } from '@proton/payments';
import { updateAutoDelete } from '@proton/shared/lib/api/mailSettings';
import { enableBreachAlert } from '@proton/shared/lib/api/settings';
import { TelemetryMailOnboardingEvents } from '@proton/shared/lib/api/telemetry';
import { BRAND_NAME, DARK_WEB_MONITORING_NAME, MEMBER_SUBSCRIBER } from '@proton/shared/lib/constants';
import { traceInitiativeError } from '@proton/shared/lib/helpers/sentry';
import { DARK_WEB_MONITORING_STATE } from '@proton/shared/lib/interfaces';
import { getIsBYOEAccount } from '@proton/shared/lib/keys';
import { AUTO_DELETE_SPAM_AND_TRASH_DAYS } from '@proton/shared/lib/mail/mailSettings';
import aliasesIcon from '@proton/styles/assets/img/onboarding/mail_onboarding_aliases.svg';
import autoDeleteIcon from '@proton/styles/assets/img/onboarding/mail_onboarding_auto_delete.svg';
import monitoringIcon from '@proton/styles/assets/img/onboarding/mail_onboarding_dark_web_monitoring.svg';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';

import { useMailOnboardingTelemetry } from 'proton-mail/components/onboarding/useMailOnboardingTelemetry';

import type { OnboardingStepEligibleCallback } from '../interface';
import OnboardingContent from '../layout/OnboardingContent';

type FeatureID = 'aliases' | 'monitoring' | 'autoDelete';

interface Feature {
    id: FeatureID;
    title: string;
    description: string;
    icon: string;
}

const useGetFeatures = (shortDomain: string, isBYOE: boolean) => {
    const aliases: Feature = {
        id: 'aliases',
        title: shortDomain,
        // translator: Keep this description short. Avoid going over 70 char
        description: c('Onboarding modal').t`Start using the shorter, catchier version of your email address.`,
        icon: aliasesIcon,
    };
    const monitoring: Feature = {
        id: 'monitoring',
        title: DARK_WEB_MONITORING_NAME,
        // translator: Keep this description short. Avoid going over 70 char
        description: c('Onboarding modal').t`Get notified if your password is compromised.`,
        icon: monitoringIcon,
    };
    const autoDelete: Feature = {
        id: 'autoDelete',
        // translator: Keep this title short.
        title: c('Onboarding modal').t`Auto-delete spam and trash`,
        // translator: Keep this description short. Avoid going over 70 char
        description: c('Onboarding modal').t`Clear out deleted and spam emails after 30 days.`,
        icon: autoDeleteIcon,
    };

    return [!isBYOE && aliases, monitoring, autoDelete].filter(isTruthy);
};

interface FeatureItemProps extends Feature {
    checked: boolean;
    isActivated: boolean;
    onToggle: (checked: boolean) => void;
}

const FeatureItem = ({ checked, description, icon, id, isActivated, onToggle, title }: FeatureItemProps) => {
    const { viewportWidth } = useActiveBreakpoint();
    const isSmallViewPort = viewportWidth['<=small'];
    const inputId = `onboarding-feature-${id}`;

    return (
        <div className={'flex flex-row gap-4 items-center relative'}>
            <img
                className={clsx('w-custom user-select-none', isSmallViewPort && 'self-start')}
                style={{ '--w-custom': isSmallViewPort ? '3rem' : '5rem' }}
                src={icon}
                alt=""
            />
            <div className="flex-1 flex gap-0 user-select-none">
                <label className="m-0 mr-2 mb-1 text-weak text-cut block" htmlFor={inputId}>
                    <strong>{title}</strong>
                </label>
                {isActivated ? (
                    <LabelStack className="text-uppercase self-start" labels={[{ color: '#1da583', name: 'active' }]} />
                ) : null}
                <p className="m-0 text-weak">{description}</p>
            </div>
            {isActivated ? null : (
                <Toggle id={inputId} onChange={(event) => onToggle(event.target.checked)} checked={checked} />
            )}
        </div>
    );
};

export const isActivatePremiumFeaturesStepEligible: OnboardingStepEligibleCallback = async (dispatch) => {
    const [user, subscription, organization, member] = await Promise.all([
        dispatch(userThunk()),
        dispatch(subscriptionThunk()),
        dispatch(organizationThunk()),
        dispatch(memberThunk()),
    ]);

    let canDisplayPremiumFeaturesStep = false;
    const isUserWithB2BPlan = getIsB2BAudienceFromSubscription(subscription);
    const isSubUserWithB2BPlan = organization && getIsB2BAudienceFromPlan(organization.PlanName);
    const isVisionarySubUser = (() => {
        const isMainAdmin = member?.Subscriber === MEMBER_SUBSCRIBER.PAYER;
        if (isMainAdmin) {
            return false;
        }

        return (organization && organization.PlanName === PLANS.VISIONARY) || hasVisionary(subscription);
    })();

    const isMailPaidPlan = isTrial(subscription, PLANS.MAIL) || user.hasPaidMail;

    if (isUserWithB2BPlan || isSubUserWithB2BPlan || isVisionarySubUser) {
        canDisplayPremiumFeaturesStep = false;
    } else if (isMailPaidPlan) {
        canDisplayPremiumFeaturesStep = true;
    }

    return {
        canDisplay: canDisplayPremiumFeaturesStep,
        preload: [aliasesIcon, autoDeleteIcon, monitoringIcon],
    };
};

const ActivatePremiumFeaturesStep = ({ onNext }: OnboardingStepRenderCallback) => {
    const api = useApi();
    const sendMailOnboardingTelemetry = useMailOnboardingTelemetry();
    const [addresses, addressesLoading] = useAddresses();
    const [userSettings, userSettingsLoading] = useUserSettings();
    const [mailSettings, mailSettingsLoading] = useMailSettings();
    const { call } = useEventManager();
    const { shortDomainAddress, createShortDomainAddress, loadingDependencies, hasShortDomain } =
        useShortDomainAddress();
    const [user] = useUser();
    const isBYOE = getIsBYOEAccount(user);
    const features = useGetFeatures(shortDomainAddress, isBYOE);

    const [checkedFeatures, setCheckedFeatures] = useState<Record<FeatureID, boolean>>({
        aliases: !isBYOE, // We don't want BYOE users to set up short domain address during onboarding
        autoDelete: true,
        monitoring: true,
    });

    const activeFeatures: Record<FeatureID, boolean> = {
        aliases: addresses ? hasShortDomain(addresses) : false,
        autoDelete: Boolean(mailSettings?.AutoDeleteSpamAndTrashDays),
        monitoring: userSettings.BreachAlerts.Value === DARK_WEB_MONITORING_STATE.ENABLED,
    };

    const loadingDeps = addressesLoading || userSettingsLoading || mailSettingsLoading || loadingDependencies;
    const hasAllItemsActivated = Object.values(activeFeatures).every(Boolean);

    const handleToggleFeature = (id: FeatureID) => (isChecked: boolean) =>
        setCheckedFeatures((prev) => ({ ...prev, [id]: isChecked }));

    const hasNoItemsChecked = !Object.values(checkedFeatures).some(Boolean);

    const handleNext = () => {
        const promises: Promise<any>[] = [
            sendMailOnboardingTelemetry(TelemetryMailOnboardingEvents.premium_features, {
                feature_auto_delete: checkedFeatures.autoDelete ? 'yes' : 'no',
                feature_dark_web_monitoring: checkedFeatures.monitoring ? 'yes' : 'no',
                feature_short_domain: checkedFeatures.aliases ? 'yes' : 'no',
            }),
        ];

        if (checkedFeatures.aliases && !activeFeatures.aliases) {
            promises.push(createShortDomainAddress({ setDefault: true }));
        }
        if (checkedFeatures.autoDelete && !activeFeatures.autoDelete) {
            promises.push(api(updateAutoDelete(AUTO_DELETE_SPAM_AND_TRASH_DAYS.ACTIVE)));
        }
        if (checkedFeatures.monitoring && !activeFeatures.monitoring) {
            promises.push(api(enableBreachAlert()));
        }

        void Promise.allSettled(promises).then((results) => {
            results.forEach((result) => {
                if (result.status === 'rejected') {
                    console.error(result.reason);
                    traceInitiativeError('mail-onboarding', result.reason);
                }
            });
            void call();
        });

        onNext();
    };

    return (
        <OnboardingStep>
            <OnboardingContent
                title={
                    // translator: Keep this title short. Avoid making char length bigger than english one.
                    // If too long translating to "Premium features" only is ok.
                    c('Onboarding modal').t`Activate premium features`
                }
                description={c('Onboarding modal').t`Make the most of your paid plan.`}
                className="mb-16 onboarding-modal-premium-features"
            >
                <div className="flex flex-column gap-4">
                    {loadingDeps ? (
                        <Loader
                            size="medium"
                            className="min-h-custom mx-auto flex"
                            style={{
                                '--min-h-custom': '17rem',
                            }}
                        />
                    ) : (
                        features.map(({ id, title, description, icon }) => (
                            <FeatureItem
                                checked={checkedFeatures[id]}
                                description={description}
                                icon={icon}
                                id={id}
                                isActivated={activeFeatures[id]}
                                key={id}
                                onToggle={handleToggleFeature(id)}
                                title={title}
                            />
                        ))
                    )}
                </div>
            </OnboardingContent>
            <footer className="mt-auto">
                <Button size="large" fullWidth color="norm" onClick={handleNext} disabled={loadingDeps}>
                    {hasAllItemsActivated || hasNoItemsChecked
                        ? c('Onboarding modal').t`Start using ${BRAND_NAME}`
                        : c('Onboarding modal').t`Activate selected`}
                </Button>
            </footer>
        </OnboardingStep>
    );
};

export default ActivatePremiumFeaturesStep;
