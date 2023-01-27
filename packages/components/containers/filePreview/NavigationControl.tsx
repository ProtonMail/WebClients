import { RefObject } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';

import Icon from '../../components/icon/Icon';
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
        <div className="flex flex-align-items-center absolute-center">
            <Button
                icon
                shape="ghost"
                className="on-rtl-mirror"
                disabled={isPrevDisabled}
                onClick={onPrev}
                title={c('Action').t`Previous`}
                data-testid="preview:button:previous"
            >
                <Icon name="chevron-left" size={16} alt={c('Action').t`Previous`} />
            </Button>
            <span className="ml0-5 mr0-5">
                <span data-testid="preview:current-attachment">{current}</span>
                <span className="ml0-25 mr0-25 color-weak text-sm">{c('Info').t`of`}</span>
                <span data-testid="preview:all-attachments">{total}</span>
            </span>
            <Button
                icon
                shape="ghost"
                className="on-rtl-mirror"
                disabled={isNextDisabled}
                onClick={onNext}
                title={c('Action').t`Next`}
                data-testid="preview:button:next"
            >
                <Icon name="chevron-right" size={16} alt={c('Action').t`Next`} />
            </Button>
        </div>
    );
};

export default NavigationControl;
