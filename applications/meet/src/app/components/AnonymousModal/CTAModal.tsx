// Cleanup with MeetNewCTAModal ff cleanup
import type { UpsellModalTypes } from '@proton/meet/types/types';
import { useFlag } from '@proton/unleash/useFlag';

import { CTAModalNew } from './CTAModalNew';
import { CTAModalOld } from './CTAModalOld';
import type { CTAModalBaseProps } from './shared/types';

export interface CTAModalProps extends CTAModalBaseProps {
    ctaModalType: UpsellModalTypes;
}

export const CTAModal = (props: CTAModalProps) => {
    const newCTAModal = useFlag('MeetNewCTAModal');

    if (!newCTAModal) {
        return <CTAModalOld {...props} />;
    }

    return <CTAModalNew {...props} />;
};
