import type { ReactNode } from 'react';

import { useUser } from '@proton/account/user/hooks';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { DashboardCard, DashboardCardContent, DashboardCardImage } from '@proton/atoms/DashboardCard/DashboardCard';
import { DashboardGridSection } from '@proton/atoms/DashboardGrid/DashboardGrid';
import ProductLink from '@proton/components/containers/app/ProductLink';
import type { PlanCardFeatureDefinition } from '@proton/components/containers/payments/features/interface';
import { PlanCardFeatureList } from '@proton/components/containers/payments/subscription/PlanCardFeatures';
import useConfig from '@proton/components/hooks/useConfig';
import { IcArrowRight } from '@proton/icons/icons/IcArrowRight';
import type { APP_NAMES } from '@proton/shared/lib/constants';

interface Configuration {
    app: APP_NAMES;
    image: string;
    logo: ReactNode;
    features: PlanCardFeatureDefinition[];
    copy: () => string;
    buttonCopy: () => string;
}
interface Props {
    config: Configuration;
    shouldDisplayAllFeatures: boolean;
    app: APP_NAMES;
}

const AlsoInYourPlanSectionCard = ({ config, shouldDisplayAllFeatures, app }: Props) => {
    const { APP_NAME } = useConfig();
    const [user] = useUser();
    return (
        <DashboardGridSection key={config.app}>
            <DashboardCard className="flex flex-column">
                <DashboardCardImage>
                    <img src={config.image} alt="" className="w-full" />
                </DashboardCardImage>
                <DashboardCardContent className="flex flex-column gap-2 grow">
                    <div className="block">{config.logo}</div>
                    {shouldDisplayAllFeatures ? (
                        <PlanCardFeatureList
                            features={config.features}
                            icon
                            odd={false}
                            margin={false}
                            className="gap-2"
                        />
                    ) : (
                        <p className="m-0">{config.copy()}</p>
                    )}
                    <footer className="mt-auto pt-2">
                        <ButtonLike
                            as={ProductLink}
                            ownerApp={APP_NAME}
                            appToLinkTo={config.app}
                            app={app}
                            user={user}
                            fullWidth
                            shape="solid"
                            color="weak"
                            className="flex items-center justify-center gap-2"
                        >
                            {config.buttonCopy()}
                            <IcArrowRight className="shrink-0" />
                        </ButtonLike>
                    </footer>
                </DashboardCardContent>
            </DashboardCard>
        </DashboardGridSection>
    );
};

export default AlsoInYourPlanSectionCard;
