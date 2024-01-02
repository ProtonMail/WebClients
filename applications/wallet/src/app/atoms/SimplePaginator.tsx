import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Icon from '@proton/components/components/icon/Icon';

interface Props {
    canGoNext: boolean;
    onNext: () => void;
    canGoPrev: boolean;
    onPrev: () => void;
}

export const SimplePaginator = ({ onNext, onPrev, canGoNext, canGoPrev }: Props) => {
    return (
        <div className="flex flex-row">
            <Button
                onClick={() => onPrev()}
                disabled={!canGoPrev}
                icon
                title={c('Pagination').t`Previous`}
                size="small"
                className="mx-1"
            >
                <Icon name="chevron-left" />
            </Button>
            <Button
                onClick={() => onNext()}
                disabled={!canGoNext}
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
