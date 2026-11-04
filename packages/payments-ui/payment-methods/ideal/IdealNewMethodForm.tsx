import type { ReactNode } from 'react';

import {
    IdealAccountHolderInput,
    type IdealAccountHolderInputProps,
} from '../../ui/components/IdealAccountHolderInput';
import { IdealInfoMessage } from './IdealInfoMessage';

type Props = IdealAccountHolderInputProps & {
    taxFields: ReactNode;
};

export const IdealNewMethodForm = ({ chargebeeIdeal, taxFields }: Props) => (
    <>
        <IdealAccountHolderInput chargebeeIdeal={chargebeeIdeal} />
        {taxFields}
        <div className="p-4 border rounded bg-weak mb-4" data-testid="ideal-view">
            <IdealInfoMessage />
        </div>
    </>
);
