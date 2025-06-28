import { useState } from 'react';

import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { Button } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import B2BOnboardingFeatureItem from '@proton/components/components/onboarding/b2b/B2BOnboardingFeatureItem';
import { getFeatures, getSections } from '@proton/components/components/onboarding/b2b/helpers';
import { type B2BFeaturesID } from '@proton/components/components/onboarding/b2b/interface';
import useApi from '@proton/components/hooks/useApi';
import useConfig from '@proton/components/hooks/useConfig';
import { TelemetryB2BOnboardingEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';

interface Props {
    onClose?: () => void;
}

const OnboardingDiscoverFeaturesStep = ({ onClose }: Props) => {
    const [subscription] = useSubscription();
    const { APP_NAME } = useConfig();
    const api = useApi();

    const [expanded, setExpanded] = useState(false);

    const handleOnClickFeatureCTA = async (item: B2BFeaturesID) => {
        await sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.b2bOnboarding,
            event: TelemetryB2BOnboardingEvents.click_modal_item,
            dimensions: {
                app: APP_NAME,
                item,
            },
            delay: false,
        });

        onClose?.();
    };

    // In case we are in account, we need to display the feature list in a different order
    const parentApp = getAppFromPathnameSafe(window.location.pathname);

    const allFeatures = getFeatures(subscription, handleOnClickFeatureCTA).filter((feature) => feature.canShowFeature);

    // Remove sections having no features
    const allSections = getSections(APP_NAME, parentApp).filter((section) => section.featuresList.length != 0);
    // If not expanded, show only the first 4 items of the first section. Otherwise, show them all.
    const firstSection = allSections[0];
    const filteredSections = expanded
        ? allSections
        : [
              {
                  ...firstSection,
                  featuresList: firstSection.featuresList.slice(0, Math.min(4, firstSection.featuresList.length - 1)),
              },
          ];

    return (
        <>
            <ModalTwoHeader
                title={c('Title').t`Set up your organization`}
                titleClassName="b2b-onboarding-modal-title text-center mt-4 mb-2"
                subline={c('Description')
                    .t`Use this guide to get your organization promptly benefiting from ${BRAND_NAME}'s industry-leading encryption and privacy ecosystem.`}
                sublineClassName="b2b-onboarding-modal-subline text-center text-xl my-3 text-wrap-balance"
            />
            <ModalTwoContent>
                {filteredSections.length > 0 &&
                    filteredSections.map((section) => {
                        return (
                            <div className="b2b-onboarding-modal-list mx-auto pt-4" key={section.title}>
                                <h2 className="text-sm color-hint text-semibold sm:px-4">{section.title}</h2>
                                <ul className="unstyled mt-0">
                                    {section.featuresList.map((featureID) => {
                                        const feature = allFeatures.find((feature) => feature.id === featureID)!;
                                        if (feature) {
                                            return (
                                                <li key={featureID}>
                                                    <B2BOnboardingFeatureItem feature={feature} />
                                                </li>
                                            );
                                        }
                                        return null;
                                    })}
                                </ul>
                            </div>
                        );
                    })}
                {!expanded && (
                    <div className="flex pb-4">
                        <Button
                            className="mx-auto inline-flex flex-nowrap items-center flex-row gap-2"
                            shape="outline"
                            onClick={() => setExpanded(true)}
                        >
                            {c('Action').t`Show more`}
                            <Icon name="arrow-down" />
                        </Button>
                    </div>
                )}
            </ModalTwoContent>
        </>
    );
};

export default OnboardingDiscoverFeaturesStep;
