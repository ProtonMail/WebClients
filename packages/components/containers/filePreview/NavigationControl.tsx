import React from 'react';
import { c } from 'ttag';
import Icon from '../../components/icon/Icon';
import { Button } from '../../components';

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
            <Button icon shape="ghost" disabled={isPrevDisabled} onClick={onPrev} title={c('Action').t`Previous`}>
                <Icon name="caret" rotate={90} size={16} alt={c('Action').t`Previous`} />
            </Button>
            <span className="ml0-5 mr0-5">
                <span>{current}</span>
                <span className="ml0-25 mr0-25 color-weak text-sm">{c('Info').t`of`}</span>
                <span>{total}</span>
            </span>
            <Button icon shape="ghost" disabled={isNextDisabled} onClick={onNext} title={c('Action').t`Next`}>
                <Icon name="caret" rotate={-90} size={16} alt={c('Action').t`Next`} />
            </Button>
        </div>
    );
};

export default NavigationControl;
