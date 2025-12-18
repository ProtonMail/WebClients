import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import type { FunctionComponent } from 'react';
import { Icon } from '@proton/components';

import { c } from 'ttag';

interface Props {
    onReindex: () => void;
    onClear: () => void;
    disabled: boolean;
}

export const SearchIndexManagement: FunctionComponent<Props> = ({ onReindex, onClear, disabled }) => (
    <div className="flex gap-2">
        {!disabled &&
            <Button color="norm"
                    onClick={onReindex}
                    title={c('Action').t`Re-index all conversations`}>
                    c('Action').t`Reindex`
            </Button>
        }
    </div>
);


