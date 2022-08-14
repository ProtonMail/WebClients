import { c } from 'ttag';

import { Button } from '../../components';
import { classnames } from '../../helpers';

import './ThemeCard.scss';

// just for proper sizing when zooming

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
            fullWidth
            className={classnames(['theme-card-button', selected && 'is-active no-pointer-events text-bold'])}
            aria-pressed={selected}
            onClick={onChange}
            disabled={disabled}
            type="button"
            aria-label={c('Action').t`Use ${label} theme`}
            title={c('Action').t`Use ${label} theme`}
        >
            <span className="flex flex-nowrap flex-column flex-align-items-center">
                <img alt="" src={src} className="mb0-5 theme-card-image rounded-sm on-rtl-mirror" />
                <div className="py0-25">{label}</div>
            </span>
        </Button>
    );
};

export default ThemeCard;
