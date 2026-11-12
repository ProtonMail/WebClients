import type { ReactNode } from 'react';

import { PromotionBanner } from '../../../banner/PromotionBanner';

type Props = {
    title: string;
    button: ReactNode;
};

export const UpgradeBanner = ({ title, button }: Props) => {
    return (
        <PromotionBanner
            mode="banner"
            rounded="xl"
            contentCentered={false}
            description={title}
            cta={button}
            data-testid="revisions-upgrade-banner"
        />
    );
};
