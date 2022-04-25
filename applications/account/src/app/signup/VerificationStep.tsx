import { c } from 'ttag';
import { HumanVerificationForm } from '@proton/components';
import { HumanVerificationFormProps } from '@proton/components/containers/api/humanVerification/HumanVerificationForm';
import Header from '../public/Header';
import Main from '../public/Main';
import Content from '../public/Content';

interface Props extends HumanVerificationFormProps {
    onBack?: () => void;
}

const VerificationStep = ({ onBack, ...rest }: Props) => {
    return (
        <Main>
            <Header title={c('Title').t`Verification`} onBack={onBack} />
            <Content>
                <HumanVerificationForm {...rest} />
            </Content>
        </Main>
    );
};

export default VerificationStep;
