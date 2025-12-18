import { Button } from '@proton/atoms/Button/Button';
import type { FunctionComponent } from 'react';

import { c } from 'ttag';

interface Props {
    onReindex: () => void;
    disabled: boolean;
}

export const SearchIndexManagement: FunctionComponent<Props> = ({ onReindex, disabled }) => (
    <div className="flex gap-2">
        {!disabled &&
            <Button color="norm"
                    onClick={onReindex}
                    title={c('Action').t`Re-index all conversations`}>
                    {c('Action').t`Reindex`}
            </Button>
        }
    </div>
);


