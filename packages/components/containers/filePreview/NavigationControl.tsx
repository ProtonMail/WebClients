import type { RefObject } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';

import { useHotkeys } from '../../hooks';

interface Props {
    current: number;
    total: number;
    rootRef: RefObject<HTMLDivElement>;
    onNext: () => void;
    onPrev: () => void;
}

const NavigationControl = ({ current, total, rootRef, onNext, onPrev }: Props) => {
    const isPrevDisabled = current === 1;
    const isNextDisabled = current === total;

    useHotkeys(rootRef, [
        [
            'ArrowLeft',
            (e) => {
                e.stopPropagation();
                if (!isPrevDisabled) {
                    onPrev();
                }
            },
        ],
        [
            'ArrowRight',
            (e) => {
                e.stopPropagation();
                if (!isNextDisabled) {
                    onNext();
                }
            },
        ],
    ]);

    return (
        <div className="flex items-center absolute inset-center">
            <Button
                icon
                shape="ghost"
                className="rtl:mirror"
                disabled={isPrevDisabled}
                onClick={onPrev}
                title={c('Action').t`Previous`}
                data-testid="file-preview:navigation:prev"
            >
                <Icon name="chevron-left" size={4} alt={c('Action').t`Previous`} />
            </Button>
            <span className="mx-2">
                <span data-testid="preview:current-attachment">{current}</span>
                <span className="mx-1 color-weak text-sm">{c('Info').t`of`}</span>
                <span data-testid="preview:all-attachments">{total}</span>
            </span>
            <Button
                icon
                shape="ghost"
                className="rtl:mirror"
                disabled={isNextDisabled}
                onClick={onNext}
                title={c('Action').t`Next`}
                data-testid="file-preview:navigation:next"
            >
                <Icon name="chevron-right" size={4} alt={c('Action').t`Next`} />
            </Button>
        </div>
    );
};

export default NavigationControl;
