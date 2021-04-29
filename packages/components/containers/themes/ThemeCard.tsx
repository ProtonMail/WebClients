import React from 'react';
import { c } from 'ttag';

import { Button } from '../../components';
import { classnames } from '../../helpers';

interface Props {
    label: string;
    id: string;
    src: string;
    checked: boolean;
    onChange: () => void;
    disabled?: boolean;
}

const ThemeCard = ({ label, id, src, checked, onChange, disabled }: Props) => {
    return (
        <Button
            name="themeCard"
            shape="outline"
            color="weak"
            id={id}
            className={classnames(['mr1 mb1', checked && 'is-active no-pointer-events text-bold'])}
            aria-pressed={checked}
            onClick={onChange}
            disabled={disabled}
            type="button"
            aria-label={c('Action').t`Use “${label}” theme`}
        >
            <span className="flex flex-nowrap flex-column">
                <img alt="" src={src} className="mb0-5" />
                <span>{label}</span>
            </span>
        </Button>
    );
};

export default ThemeCard;
