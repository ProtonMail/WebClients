import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import BornPrivateFeatures from '../../components/BornPrivateFeatures';
import BornPrivateFooter from '../../components/BornPrivateFooter';
import BornPrivateHeader from '../../components/BornPrivateHeader';
import BornPrivateHeading from '../../components/BornPrivateHeading';
import BornPrivateLayout from '../../components/BornPrivateLayout';
import BornPrivateMain from '../../components/BornPrivateMain';
import BornPrivateFormContainer from '../../components/form/BornPrivateFormContainer';
import BornPrivateFormFooter from '../../components/form/BornPrivateFormFooter';
import BornPrivateFormHeading from '../../components/form/BornPrivateFormHeading';
import { Steps, TOTAL_STEPS } from '../EmailReservationSignup';
import EmailReservationInput from '../components/EmailReservationInput';
import HowItWorks from '../components/HowItWorks';
import VoucherInformation from '../components/VoucherInformation';

interface EmailReservationProps {
    onContinue: () => void;
}

const EmailReservation = ({ onContinue }: EmailReservationProps) => {
    return (
        <BornPrivateLayout>
            <BornPrivateHeader />
            <BornPrivateMain>
                <BornPrivateHeading />
                <BornPrivateFeatures />
                <BornPrivateFormContainer onSubmit={onContinue}>
                    <BornPrivateFormHeading>{c('Heading').t`Reserve child's email address`}</BornPrivateFormHeading>
                    <EmailReservationInput onEnter={onContinue} />
                    <HowItWorks />
                    <VoucherInformation />
                    <BornPrivateFormFooter step={Steps.Reservation} totalSteps={TOTAL_STEPS}>
                        <Button type="submit" color="norm" size="large" className="w-full md:w-auto rounded-lg">
                            {c('Action').t`Continue`}
                        </Button>
                    </BornPrivateFormFooter>
                </BornPrivateFormContainer>
            </BornPrivateMain>
            <BornPrivateFooter />
        </BornPrivateLayout>
    );
};

export default EmailReservation;
