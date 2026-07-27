import type { FC, KeyboardEvent, MouseEvent } from 'react';

import { IcCross } from '@proton/icons/icons/IcCross';

import './FilterClearButton.scss';

type Props = {
    onClear: (event: MouseEvent | KeyboardEvent) => void;
    title: string;
};

export const FilterClearButton: FC<Props> = ({ onClear, title }) => (
    <button type="button" className="pass-filter-clear-button" onClick={onClear} title={title}>
        <IcCross size={2.5} alt={title} />
    </button>
);
