import { memo } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcCross } from '@proton/icons/icons/IcCross';

import './ResetFiltersButton.scss';

type Props = {
    onClick: () => void;
};

export const ResetFiltersButton = memo(({ onClick }: Props) => (
    <Button
        shape="solid"
        size="small"
        color="weak"
        onClick={onClick}
        className="pass-reset-filters-button flex flex-nowrap gap-1.5 shrink-0 text-sm text-semibold"
    >
        <span className="pass-reset-filters-button-icon">
            <IcCross size={2.5} alt={c('Action').t`Reset filters`} />
        </span>
        {c('Action').t`Reset filters`}
    </Button>
));

ResetFiltersButton.displayName = 'ResetFiltersButtonMemo';
