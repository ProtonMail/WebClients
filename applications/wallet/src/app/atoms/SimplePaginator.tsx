import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';

interface Props {
    canGoNext: boolean;
    onNext: () => void;
    canGoPrev: boolean;
    onPrev: () => void;
    disabled: boolean;
}

export const SimplePaginator = ({ onNext, onPrev, canGoNext, canGoPrev, disabled = false }: Props) => {
    return (
        <div className="flex flex-row">
            <Button
                onClick={() => onPrev()}
                disabled={!canGoPrev || disabled}
                icon
                title={c('Action').t`Previous`}
                size="small"
                className="mx-1"
            >
                <Icon name="chevron-left" alt={c('Action').t`Previous`} />
            </Button>
            <Button
                onClick={() => onNext()}
                disabled={!canGoNext || disabled}
                icon
                title={c('Action').t`Next`}
                size="small"
                className="mx-1"
            >
                <Icon name="chevron-right" alt={c('Action').t`Next`} />
            </Button>
        </div>
    );
};
