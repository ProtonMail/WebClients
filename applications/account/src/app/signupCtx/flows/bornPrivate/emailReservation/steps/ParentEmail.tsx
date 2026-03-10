import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { useFormErrors } from '@proton/components';

import BornPrivateFeatures from '../../components/BornPrivateFeatures';
import BornPrivateFooter from '../../components/BornPrivateFooter';
import BornPrivateHeader from '../../components/BornPrivateHeader';
import BornPrivateHeading from '../../components/BornPrivateHeading';
import BornPrivateLayout from '../../components/BornPrivateLayout';
import BornPrivateMain from '../../components/BornPrivateMain';
import BornPrivateFormContainer from '../../components/form/BornPrivateFormContainer';
import BornPrivateFormFooter from '../../components/form/BornPrivateFormFooter';
import BornPrivateFormHeading from '../../components/form/BornPrivateFormHeading';
import BornPrivateFormParagraph from '../../components/form/BornPrivateFormParagraph';
import { Steps, TOTAL_STEPS } from '../EmailReservationSignup';
import ParentEmailInput from '../components/ParentEmaiInput';

interface ParentEmailProps {
    defaultEmail?: string;
    onContinue: (email: string) => void;
    onBack: () => void;
}

const ParentEmail = ({ defaultEmail, onContinue, onBack }: ParentEmailProps) => {
    const [email, setEmail] = useState(defaultEmail ?? '');
    const { validator, onFormSubmit } = useFormErrors();

    const handleSubmit = () => {
        if (onFormSubmit()) {
            onContinue(email);
        }
    };

    return (
        <BornPrivateLayout>
            <BornPrivateHeader />
            <BornPrivateMain>
                <BornPrivateHeading />
                <BornPrivateFeatures />
                <BornPrivateFormContainer onSubmit={handleSubmit}>
                    <BornPrivateFormHeading>{c('Form heading').t`Enter your email address`}</BornPrivateFormHeading>
                    <BornPrivateFormParagraph>{c('Form paragraph')
                        .t`The voucher will be sent here.`}</BornPrivateFormParagraph>
                    <ParentEmailInput value={email} onValue={setEmail} validator={validator} />
                    <BornPrivateFormFooter step={Steps.ParentEmail} totalSteps={TOTAL_STEPS}>
                        <Button onClick={onBack} size="large" className="w-full md:w-auto rounded-lg">
                            {c('Action').t`Back`}
                        </Button>
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

export default ParentEmail;
