import { c } from 'ttag';

import type { ModalProps } from '@proton/components';
import { getMailPlusInboxFeatures } from '@proton/components';
import { PLANS } from '@proton/payments';

import Trial2024UpsellModal, { type Props as Trial2024UpsellModalProps } from './Trial2024UpsellModal';
import useMailSignupUpsellTelemetry from './useMailSignupUpsellTelemetry';

type Props = ModalProps & Omit<Trial2024UpsellModalProps, 'planName' | 'ctaTitle' | 'features' | 'telemetry'>;

const MailTrial2024UpsellModal = (props: Props) => {
    const telemetry = useMailSignupUpsellTelemetry();

    return (
        <Trial2024UpsellModal
            {...props}
            planName={PLANS.MAIL}
            ctaTitle={c('mailtrial2024: Action').t`Special Offer`}
            features={getMailPlusInboxFeatures()}
            telemetry={telemetry}
        />
    );
};

export default MailTrial2024UpsellModal;
