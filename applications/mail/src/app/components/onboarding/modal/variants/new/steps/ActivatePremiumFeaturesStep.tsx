import { useMemo, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    OnboardingStep,
    type OnboardingStepRenderCallback,
    Toggle,
    useActiveBreakpoint,
    useApi,
    useAuthentication,
    useEventManager,
    useGetAddresses,
    useGetUserKeys,
    useKTVerifier,
    useProtonDomains,
    useUser,
} from '@proton/components';
import { orderAddress, setupAddress } from '@proton/shared/lib/api/addresses';
import { updateAutoDelete } from '@proton/shared/lib/api/mailSettings';
import { enableBreachAlert } from '@proton/shared/lib/api/settings';
import { TelemetryMailOnboardingEvents } from '@proton/shared/lib/api/telemetry';
import { BRAND_NAME, DEFAULT_KEYGEN_TYPE, KEYGEN_CONFIGS } from '@proton/shared/lib/constants';
import { missingKeysSelfProcess } from '@proton/shared/lib/keys';
import { AUTO_DELETE_SPAM_AND_TRASH_DAYS } from '@proton/shared/lib/mail/mailSettings';
import aliasesIcon from '@proton/styles/assets/img/onboarding/mail_onboarding_aliases.svg';
import autoDeleteIcon from '@proton/styles/assets/img/onboarding/mail_onboarding_auto_delete.svg';
import monitoringIcon from '@proton/styles/assets/img/onboarding/mail_onboarding_dark_web_monitoring.svg';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

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
    onToggle: (checked: boolean) => void;
}

const FeatureItem = ({ checked, description, icon, id, onToggle, title }: FeatureItemProps) => {
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
                <label className="m-0 mb-1 text-weak text-cut block" htmlFor={inputId}>
                    <strong>{title}</strong>
                </label>
                <p className="m-0 text-weak">{description}</p>
            </div>
            <Toggle id={inputId} onChange={(event) => onToggle(event.target.checked)} checked={checked} />
        </div>
    );
};

const usePmMeAddress = () => {
    const api = useApi();
    const [user, loadingUser] = useUser();
    const shortDomain = `${user.Name}@pm.me`;
    const [{ premiumDomains }, loadingProtonDomains] = useProtonDomains();
    const getAddresses = useGetAddresses();
    const authentication = useAuthentication();
    const { call } = useEventManager();
    const getUserKeys = useGetUserKeys();
    const { keyTransparencyVerify, keyTransparencyCommit } = useKTVerifier(api, async () => user);

    return {
        shortDomain,
        createPmMeAddress: async () => {
            const [Domain = ''] = premiumDomains;
            const addresses = await getAddresses();

            // Early return if the address already exists
            if (addresses.some(({ Email }) => Email === shortDomain)) {
                return;
            }

            // Create address
            const [{ DisplayName = '', Signature = '' } = {}] = addresses || [];
            const { Address } = await api(
                setupAddress({
                    Domain,
                    DisplayName: DisplayName || '', // DisplayName can be null
                    Signature: Signature || '', // Signature can be null
                })
            );
            const userKeys = await getUserKeys();
            await missingKeysSelfProcess({
                api,
                userKeys,
                addresses,
                addressesToGenerate: [Address],
                password: authentication.getPassword(),
                keyGenConfig: KEYGEN_CONFIGS[DEFAULT_KEYGEN_TYPE],
                onUpdate: noop,
                keyTransparencyVerify,
            });
            await keyTransparencyCommit(userKeys);

            // Made this address default
            await api(orderAddress([Address.ID, ...addresses.map(({ ID }) => ID)]));

            // Call event manager to ensure all the UI is up to date
            await call();
        },
        loadingDependency: loadingProtonDomains || loadingUser,
    };
};

const ActivatePremiumFeaturesStep = ({ onNext }: OnboardingStepRenderCallback) => {
    const [sendMailOnboardingTelemetry] = useMailOnboardingTelemetry();
    const api = useApi();
    const { shortDomain, createPmMeAddress, loadingDependency } = usePmMeAddress();
    const features = useGetFeatures(shortDomain);
    const [checkedItems, setCheckedItem] = useState<Record<FeatureID, boolean>>({
        aliases: true,
        autoDelete: true,
        monitoring: true,
    });
    const hasAtLeastOneChecked = Object.values(checkedItems).some(Boolean);

    const handleNext = () => {
        for (const [key, value] of Object.entries(checkedItems)) {
            if (key === 'aliases' && value) {
                void createPmMeAddress();
            }
            if (key === 'autoDelete' && value) {
                void api(updateAutoDelete(AUTO_DELETE_SPAM_AND_TRASH_DAYS.ACTIVE));
            }
            if (key === 'monitoring' && value) {
                void api(enableBreachAlert());
            }
        }

        void sendMailOnboardingTelemetry(TelemetryMailOnboardingEvents.premium_features, {
            feature_auto_delete: checkedItems.autoDelete ? 'yes' : 'no',
            feature_dark_web_monitoring: checkedItems.monitoring ? 'yes' : 'no',
            feature_short_domain: checkedItems.aliases ? 'yes' : 'no',
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
                            key={id}
                            id={id}
                            title={title}
                            description={description}
                            icon={icon}
                            onToggle={(checked) => {
                                setCheckedItem((prev) => ({ ...prev, [id]: checked }));
                            }}
                            checked={checkedItems[id]}
                        />
                    ))}
                </div>
            </NewOnboardingContent>
            <footer>
                <Button size="large" fullWidth color="norm" onClick={handleNext} disabled={loadingDependency}>
                    {hasAtLeastOneChecked
                        ? c('Onboarding modal').t`Activate selected`
                        : c('Onboarding modal').t`Start using ${BRAND_NAME}`}
                </Button>
            </footer>
        </OnboardingStep>
    );
};

export default ActivatePremiumFeaturesStep;
