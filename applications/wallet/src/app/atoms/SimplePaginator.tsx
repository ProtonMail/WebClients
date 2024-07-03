import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Icon from '@proton/components/components/icon/Icon';

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
                title={c('Pagination').t`Previous`}
                size="small"
                className="mx-1"
            >
                <Icon name="chevron-left" />
            </Button>
            <Button
                onClick={() => onNext()}
                disabled={!canGoNext || disabled}
                icon
                title={c('Pagination').t`Next`}
                size="small"
                className="mx-1"
            >
                <Icon name="chevron-right" />
            </Button>
        </div>
    );
};
