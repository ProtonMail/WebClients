import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import clsx from '@proton/utils/clsx';

import './LayoutCard.scss';

// just for proper sizing when zooming

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
            className={clsx(['mr-4 mb-4 layout-card-button', selected && 'is-active pointer-events-none text-bold'])}
            aria-pressed={selected}
            onClick={onChange}
            disabled={disabled}
            type="button"
            aria-label={c('Action').t`Use “${label}” setting`}
            title={c('Action').t`Use “${label}” setting`}
            aria-describedby={describedByID}
            data-testid={`layout:${label}`}
        >
            <span className="flex flex-nowrap flex-column">
                <img alt="" src={src} className="mb-2 layout-card-image rtl:mirror" width={122} height={78} />
                <span>{label}</span>
            </span>
        </Button>
    );
};

export default LayoutCard;
