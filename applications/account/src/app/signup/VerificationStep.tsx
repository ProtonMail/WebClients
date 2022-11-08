import { HumanVerificationForm } from '@proton/components';
import { HumanVerificationFormProps } from '@proton/components/containers/api/humanVerification/HumanVerificationForm';

import Content from '../public/Content';
import Header from '../public/Header';
import Main from '../public/Main';

interface Props extends HumanVerificationFormProps {
    onBack?: () => void;
    title: string;
}

const VerificationStep = ({ title, onBack, ...rest }: Props) => {
    return (
        <Main>
            <Header title={title} onBack={onBack} />
            <Content>
                <HumanVerificationForm {...rest} />
            </Content>
        </Main>
    );
};

export default VerificationStep;
