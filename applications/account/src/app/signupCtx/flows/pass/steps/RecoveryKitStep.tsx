import type { FC } from 'react';

import RecoveryStepContent from '../../../containers/recovery/RecoveryStepContent';
import { Layout } from '../components/Layout';
import { RecoveryKitAside } from './RecoveryKitAside';

type Props = {
    onContinue: () => Promise<void>;
};

export const RecoveryKitStep: FC<Props> = ({ onContinue }) => {
    return (
        <Layout aside={<RecoveryKitAside />}>
            <RecoveryStepContent onContinue={onContinue} />
        </Layout>
    );
};
