import React from 'react';
import { c } from 'ttag';

import { Button } from '../button';
import { classnames } from '../../helpers';

export interface LayoutCardProps {
    label: string;
    src: string;
    selected: boolean;
    onChange: () => void;
    disabled?: boolean;
    describedByID: string;
}

const LayoutCard = ({ label, src, selected, onChange, disabled, describedByID }: LayoutCardProps) => {
    return (
        <Button
            name="layoutCard"
            shape="outline"
            color={selected ? 'norm' : 'weak'}
            className={classnames(['mr1 mb1', selected && 'is-active no-pointer-events text-bold'])}
            aria-pressed={selected}
            onClick={onChange}
            disabled={disabled}
            type="button"
            aria-label={c('Action').t`Use “${label}” setting`}
            title={c('Action').t`Use “${label}” setting`}
            aria-describedby={describedByID}
        >
            <span className="flex flex-nowrap flex-column">
                <img alt="" src={src} className="mb0-5" />
                <span>{label}</span>
            </span>
        </Button>
    );
};

export default LayoutCard;
