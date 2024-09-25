import { HumanVerificationForm, useConfig } from '@proton/components';
import type { HumanVerificationFormProps } from '@proton/components';
import metrics, { observeApiError } from '@proton/metrics';

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
                        const [error] = args;
                        observeApiError(error, (status) =>
                            metrics.core_signup_verificationStep_verification_total.increment({
                                status,
                                application: getSignupApplication(APP_NAME),
                            })
                        );
                    }}
                    onSubmit={async (...args) => {
                        try {
                            await onSubmit?.(...args);
                            void metrics.core_signup_verificationStep_verification_total.increment({
                                status: 'success',
                                application: getSignupApplication(APP_NAME),
                            });
                        } catch (error) {
                            observeApiError(error, (status) =>
                                metrics.core_signup_verificationStep_verification_total.increment({
                                    status,
                                    application: getSignupApplication(APP_NAME),
                                })
                            );

                            throw error;
                        }
                    }}
                    onLoaded={(data) => {
                        onLoaded?.(data);
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
