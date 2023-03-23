import { HumanVerificationForm, useConfig } from '@proton/components';
import { HumanVerificationFormProps } from '@proton/components/containers/api/humanVerification/HumanVerificationForm';
import metrics from '@proton/metrics';

import Content from '../public/Content';
import Header from '../public/Header';
import Main from '../public/Main';
import { getSignupApplication } from './helper';

interface Props extends HumanVerificationFormProps {
    title: string;
    onBack?: () => void;
}

const VerificationStep = ({ title, onBack, onSubmit, onClose, onLoaded, onError, ...rest }: Props) => {
    const { APP_NAME } = useConfig();

    return (
        <Main data-testid="verification">
            <Header title={title} onBack={onBack} />
            <Content>
                <HumanVerificationForm
                    onClose={() => {
                        onClose?.();
                        void metrics.core_signup_verificationStep_verification_total.increment({
                            status: 'cancelled',
                            application: getSignupApplication(APP_NAME),
                        });
                    }}
                    onError={(...args) => {
                        onError?.(...args);
                        void metrics.core_signup_verificationStep_verification_total.increment({
                            status: 'failed',
                            application: getSignupApplication(APP_NAME),
                        });
                    }}
                    onSubmit={async (...args) => {
                        try {
                            await onSubmit?.(...args);
                            void metrics.core_signup_verificationStep_verification_total.increment({
                                status: 'successful',
                                application: getSignupApplication(APP_NAME),
                            });
                        } catch (error) {
                            void metrics.core_signup_verificationStep_verification_total.increment({
                                status: 'failed',
                                application: getSignupApplication(APP_NAME),
                            });

                            throw error;
                        }
                    }}
                    onLoaded={() => {
                        onLoaded?.();
                        void metrics.core_signup_pageLoad_total.increment({
                            step: 'verification',
                            application: getSignupApplication(APP_NAME),
                        });
                    }}
                    {...rest}
                />
            </Content>
        </Main>
    );
};

export default VerificationStep;
