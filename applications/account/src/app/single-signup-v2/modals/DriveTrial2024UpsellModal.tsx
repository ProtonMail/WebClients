import { c } from 'ttag';

import type { ModalProps } from '@proton/components';
import { getTryDrivePlus2024Features } from '@proton/components';
import { PLANS } from '@proton/payments';

import Trial2024UpsellModal, { type Props as Trial2024UpsellModalProps } from './Trial2024UpsellModal';

type Props = ModalProps & Omit<Trial2024UpsellModalProps, 'planName' | 'ctaTitle' | 'features' | 'telemetry'>;

const DriveTrial2024UpsellModal = (props: Props) => {
    return (
        <Trial2024UpsellModal
            {...props}
            planName={PLANS.DRIVE}
            ctaTitle={c('mailtrial2024: Action').t`Special Offer`}
            features={getTryDrivePlus2024Features()}
        />
    );
};

export default DriveTrial2024UpsellModal;
