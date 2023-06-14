import { c } from 'ttag';

import { Button } from '@proton/atoms';
import clsx from '@proton/utils/clsx';

import ThemeSvg, { ThemeSvgColors, ThemeSvgSize } from './ThemeSvg';

import './ThemeCard.scss';

interface Props {
    label: string;
    id: string;
    size?: ThemeSvgSize;
    colors: ThemeSvgColors;
    selected: boolean;
    onChange: () => void;
    disabled?: boolean;
}

const ThemeCard = ({ label, id, size, colors, selected, onChange, disabled }: Props) => {
    return (
        <Button
            name="themeCard"
            shape="outline"
            color={selected ? 'norm' : 'weak'}
            id={id}
            fullWidth
            className={clsx(
                'theme-card-button p-1 flex flex-nowrap flex-column gap-1 flex-align-items-center',
                selected && 'is-active no-pointer-events text-bold'
            )}
            aria-pressed={selected}
            onClick={onChange}
            disabled={disabled}
            type="button"
            aria-label={c('Action').t`Use ${label} theme`}
            title={c('Action').t`Use ${label} theme`}
        >
            <ThemeSvg className={clsx('block theme-card-image on-rtl-mirror rounded-sm')} size={size} colors={colors} />
            <span className={clsx(size === 'small' && 'sr-only', size === 'medium' && 'text-sm')}>{label}</span>
        </Button>
    );
};

export default ThemeCard;
