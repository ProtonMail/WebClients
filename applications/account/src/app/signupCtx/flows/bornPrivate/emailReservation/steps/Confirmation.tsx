import BornPrivateAside from '../../components/BornPrivateAside';
import BornPrivateFooter from '../../components/BornPrivateFooter';
import BornPrivateHeader from '../../components/BornPrivateHeader';
import BornPrivateLayout from '../../components/BornPrivateLayout';
import BornPrivateTwoColumnWrapper from '../../components/BornPrivateTwoColumnWrapper';
import EmailConfirmation from '../components/EmailConfirmation';
import VoucherDisplay from '../components/VoucherDisplay';

import './Confirmation.scss';

interface ConfirmationProps {
    reservedEmail: string;
    activationCode: string;
}

const Confirmation = ({ reservedEmail, activationCode }: ConfirmationProps) => {
    return (
        <BornPrivateLayout>
            <BornPrivateHeader />
            <BornPrivateTwoColumnWrapper>
                <EmailConfirmation reservedEmail={reservedEmail} activationCode={activationCode} />
                <BornPrivateAside>
                    <VoucherDisplay reservedEmail={reservedEmail} activationCode={activationCode} />
                </BornPrivateAside>
            </BornPrivateTwoColumnWrapper>
            <BornPrivateFooter />
        </BornPrivateLayout>
    );
};

export default Confirmation;
