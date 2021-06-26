import React from 'react';
import { c } from 'ttag';

import { Button } from '../../components';
import { classnames } from '../../helpers';
import './ThemeCard.scss'; // just for proper sizing when zooming

interface Props {
    label: string;
    id: string;
    src: string;
    selected: boolean;
    onChange: () => void;
    disabled?: boolean;
}

const ThemeCard = ({ label, id, src, selected, onChange, disabled }: Props) => {
    return (
        <Button
            name="themeCard"
            shape="outline"
            color={selected ? 'norm' : 'weak'}
            id={id}
            className={classnames([selected && 'is-active no-pointer-events text-bold'])}
            aria-pressed={selected}
            onClick={onChange}
            disabled={disabled}
            type="button"
            aria-label={c('Action').t`Use ${label} theme`}
            title={c('Action').t`Use ${label} theme`}
        >
            <span className="flex flex-nowrap flex-column">
                <img alt="" src={src} className="mb0-5 theme-card-image" />
                <span>{label}</span>
            </span>
        </Button>
    );
};

export default ThemeCard;
