import { c } from 'ttag';

import type { ModalProps } from '@proton/components';
import { getTryPassPlus2024Features } from '@proton/components/containers/offers/helpers/offerCopies';
import { PLANS } from '@proton/payments';

import Trial2024UpsellModal, { type Props as Trial2024UpsellModalProps } from './Trial2024UpsellModal';

type Props = ModalProps & Omit<Trial2024UpsellModalProps, 'planName' | 'ctaTitle' | 'features' | 'telemetry'>;

const PassTrial2024UpsellModal = (props: Props) => {
    return (
        <Trial2024UpsellModal
            {...props}
            planName={PLANS.PASS}
            ctaTitle={c('Title').t`Special Offer`}
            features={getTryPassPlus2024Features()}
        />
    );
};

export default PassTrial2024UpsellModal;
