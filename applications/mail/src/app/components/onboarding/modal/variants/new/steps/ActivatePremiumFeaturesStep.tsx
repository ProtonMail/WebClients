import { useMemo, useState } from 'react';

import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { Button } from '@proton/atoms';
import {
    LabelStack,
    OnboardingStep,
    type OnboardingStepRenderCallback,
    Toggle,
    useActiveBreakpoint,
    useApi,
    useShortDomainAddress,
} from '@proton/components';
import { useMailSettings } from '@proton/mail/mailSettings/hooks';
import { updateAutoDelete } from '@proton/shared/lib/api/mailSettings';
import { enableBreachAlert } from '@proton/shared/lib/api/settings';
import { TelemetryMailOnboardingEvents } from '@proton/shared/lib/api/telemetry';
import { ADDRESS_TYPE, BRAND_NAME } from '@proton/shared/lib/constants';
import { traceInitiativeError } from '@proton/shared/lib/helpers/sentry';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import { DARK_WEB_MONITORING_STATE } from '@proton/shared/lib/interfaces';
import { AUTO_DELETE_SPAM_AND_TRASH_DAYS } from '@proton/shared/lib/mail/mailSettings';
import aliasesIcon from '@proton/styles/assets/img/onboarding/mail_onboarding_aliases.svg';
import autoDeleteIcon from '@proton/styles/assets/img/onboarding/mail_onboarding_auto_delete.svg';
import monitoringIcon from '@proton/styles/assets/img/onboarding/mail_onboarding_dark_web_monitoring.svg';
import clsx from '@proton/utils/clsx';

import { useMailOnboardingTelemetry } from 'proton-mail/components/onboarding/useMailOnboardingTelemetry';

import NewOnboardingContent from '../layout/NewOnboardingContent';

type FeatureID = 'aliases' | 'monitoring' | 'autoDelete';

interface Feature {
    id: FeatureID;
    title: string;
    description: string;
    icon: string;
}

const useGetFeatures = (shortDomain: string) => {
    return useMemo<Feature[]>(() => {
        const aliases: Feature = {
            id: 'aliases',
            title: shortDomain,
            description: c('Onboarding modal').t`Start using the shorter, catchier version of your email address.`,
            icon: aliasesIcon,
        };
        const monitoring: Feature = {
            id: 'monitoring',
            title: c('Onboarding modal').t`Dark Web Monitoring`,
            description: c('Onboarding modal').t`Get notified if your password is compromised.`,
            icon: monitoringIcon,
        };
        const autoDelete: Feature = {
            id: 'autoDelete',
            title: c('Onboarding modal').t`Auto-delete spam and trash`,
            description: c('Onboarding modal').t`Clear out deleted and spam emails after 30 days.`,
            icon: autoDeleteIcon,
        };

        return [aliases, monitoring, autoDelete];
    }, [shortDomain]);
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

const getIsAutoDeleteEnabled = (mailSettings: MailSettings | undefined) =>
    Boolean(mailSettings?.AutoDeleteSpamAndTrashDays);

const ActivatePremiumFeaturesStep = ({ onNext }: OnboardingStepRenderCallback) => {
    const [sendMailOnboardingTelemetry] = useMailOnboardingTelemetry();
    const api = useApi();
    const {
        shortDomainAddress,
        createShortDomainAddress,
        loadingDependencies: loadingDependency,
    } = useShortDomainAddress();
    const features = useGetFeatures(shortDomainAddress);
    const [addresses] = useAddresses();
    const isAliasEnabled = Boolean(addresses?.some(({ Type }) => Type === ADDRESS_TYPE.TYPE_PREMIUM));

    const [mailSettings] = useMailSettings();
    const isAutoDeleteEnabled = getIsAutoDeleteEnabled(mailSettings);

    const [userSettings] = useUserSettings();
    const isMonitoringEnabled = userSettings.BreachAlerts.Value === DARK_WEB_MONITORING_STATE.ENABLED;

    const initialCheckedItems = {
        aliases: isAliasEnabled,
        autoDelete: isAutoDeleteEnabled,
        monitoring: isMonitoringEnabled,
    };

    const hasAllItemsActivated = isAliasEnabled && isAutoDeleteEnabled && isMonitoringEnabled;

    const [checkedItems, setCheckedItems] = useState<Record<FeatureID, boolean>>(initialCheckedItems);

    const handleItemSelect = (id: FeatureID) => (isChecked: boolean) =>
        setCheckedItems((prev) => ({ ...prev, [id]: isChecked }));

    const hasNoItemsChecked = !Object.values(checkedItems).some(Boolean);

    const handleNext = () => {
        const promises: Promise<any>[] = [
            sendMailOnboardingTelemetry(TelemetryMailOnboardingEvents.premium_features, {
                feature_auto_delete: checkedItems.autoDelete ? 'yes' : 'no',
                feature_dark_web_monitoring: checkedItems.monitoring ? 'yes' : 'no',
                feature_short_domain: checkedItems.aliases ? 'yes' : 'no',
            }),
        ];

        if (checkedItems.aliases && !isAliasEnabled) {
            promises.push(createShortDomainAddress({ setDefault: true }));
        }
        if (checkedItems.autoDelete && !isAutoDeleteEnabled) {
            promises.push(api(updateAutoDelete(AUTO_DELETE_SPAM_AND_TRASH_DAYS.ACTIVE)));
        }
        if (checkedItems.monitoring && !isMonitoringEnabled) {
            promises.push(api(enableBreachAlert()));
        }

        void Promise.allSettled(promises).then((results) => {
            results.forEach((result) => {
                if (result.status === 'rejected') {
                    console.error(result.reason);
                    traceInitiativeError('mail-onboarding', result.reason);
                }
            });
        });

        onNext();
    };

    return (
        <OnboardingStep>
            <NewOnboardingContent
                title={c('Onboarding modal').t`Activate premium features`}
                description={c('Onboarding modal').t`Make the most of your paid plan.`}
                className="mb-16"
            >
                <div className="flex flex-column gap-4">
                    {features.map(({ id, title, description, icon }) => (
                        <FeatureItem
                            checked={checkedItems[id]}
                            description={description}
                            icon={icon}
                            id={id}
                            isActivated={initialCheckedItems[id]}
                            key={id}
                            onToggle={handleItemSelect(id)}
                            title={title}
                        />
                    ))}
                </div>
            </NewOnboardingContent>
            <footer>
                <Button size="large" fullWidth color="norm" onClick={handleNext} disabled={loadingDependency}>
                    {hasAllItemsActivated || hasNoItemsChecked
                        ? c('Onboarding modal').t`Start using ${BRAND_NAME}`
                        : c('Onboarding modal').t`Activate selected`}
                </Button>
            </footer>
        </OnboardingStep>
    );
};

export default ActivatePremiumFeaturesStep;
