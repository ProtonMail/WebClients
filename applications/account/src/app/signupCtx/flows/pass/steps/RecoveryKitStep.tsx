import type { FC } from 'react';

import { c } from 'ttag';

import RecoveryStepContent from '../../../containers/recovery/RecoveryStepContent';
import { Layout } from '../components/Layout/Layout';
import { RecoveryKitAside } from './RecoveryKitAside';

type Props = {
    onContinue: () => Promise<void>;
};

export const RecoveryKitStep: FC<Props> = ({ onContinue }) => {
    return (
        <Layout aside={<RecoveryKitAside />}>
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
        </Layout>
    );
};
