import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import type { FunctionComponent } from 'react';

import { c } from 'ttag';

interface Props {
    onReindex: () => void;
    onClear: () => void;
    disabled: boolean;
}

export const SearchIndexManagement: FunctionComponent<Props> = ({ onReindex, onClear, disabled }) => (
    <div className="flex gap-2">
        <Button color="norm" onClick={onReindex} disabled={disabled} title={c('Action').t`Re-index all conversations`}>
            {disabled ? (
                <>
                    <CircleLoader size="small" className="mr-2" />
                    {c('Action').t`Indexing...`}
                </>
            ) : (
                c('Action').t`Index Now`
            )}
        </Button>
        <Button
            color="weak"
            shape="outline"
            onClick={onClear}
            disabled={disabled}
            title={c('Action').t`Clear search index`}
        >
            {c('Action').t`Clear Index`}
        </Button>
    </div>
);


