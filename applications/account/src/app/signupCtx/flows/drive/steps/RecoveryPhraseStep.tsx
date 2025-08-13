import { c } from 'ttag';

import RecoveryStepContent from '../../../containers/recovery/RecoveryStepContent';
import Header from '../components/Layout/Header';
import Layout from '../components/Layout/Layout';

const RecoveryPhraseStep = ({ onContinue }: { onContinue: () => void }) => {
    return (
        <Layout>
            <Header showSignIn={false} />
            <div
                className="flex flex-column flex-nowrap accountDetailsStep min-h-custom justify-center"
                style={{ '--min-h-custom': 'calc(100vh - 4.25rem - 3.75rem)' }}
            >
                <div className="flex items-center justify-center h-full">
                    <div className="flex flex-column md:flex-row flex-nowrap items-center justify-center w-full p-4">
                        <div className="mx-auto w-full max-w-custom" style={{ '--max-w-custom': '27rem' }}>
                            <RecoveryStepContent
                                onContinue={onContinue}
                                title={(method) => {
                                    return (
                                        <h1 className="font-arizona text-semibold text-8xl mb-4">
                                            {method === 'recovery-kit'
                                                ? c('RecoveryPhrase: Title').t`Save your Recovery Kit`
                                                : c('RecoveryPhrase: Title').t`Save your recovery phrase`}
                                        </h1>
                                    );
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default RecoveryPhraseStep;
