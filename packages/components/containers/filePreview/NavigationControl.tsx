import React from 'react';
import { c } from 'ttag';
import { classnames } from '../../helpers';
import Icon from '../../components/icon/Icon';

interface Props {
    current: number;
    total: number;
    onNext: () => void;
    onPrev: () => void;
}

const NavigationControl = ({ current, total, onNext, onPrev }: Props) => {
    const isPrevDisabled = current === 1;
    const isNextDisabled = current === total;

    return (
        <div className="flex flex-align-items-center centered-absolute">
            <button
                type="button"
                disabled={isPrevDisabled}
                onClick={onPrev}
                title={c('Action').t`Previous`}
                className={classnames(['flex p0-25 color-white', isPrevDisabled && 'opacity-50'])}
            >
                <Icon name="caret" rotate={90} size={16} />
            </button>
            <span className="ml0-5 mr0-5">
                <span>{current}</span>
                <span className="ml0-25 mr0-25 opacity-50 text-sm">{c('Info').t`of`}</span>
                <span>{total}</span>
            </span>
            <button
                type="button"
                disabled={isNextDisabled}
                onClick={onNext}
                title={c('Action').t`Next`}
                className={classnames(['flex p0-25 color-white', isNextDisabled && 'opacity-50'])}
            >
                <Icon name="caret" rotate={-90} size={16} />
            </button>
        </div>
    );
};

export default NavigationControl;
