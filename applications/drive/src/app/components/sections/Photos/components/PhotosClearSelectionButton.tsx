import type { FC } from 'react';

import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

interface Props {
    onClick: () => void;
}

export const PhotosClearSelectionButton: FC<Props> = ({ onClick }) => {
    return (
        <ToolbarButton
            title={c('Action').t`Clear selection`}
            icon={<Icon name="cross" alt={c('Action').t`Clear selection`} />}
            onClick={onClick}
            data-testid="toolbar-clear-selection"
        />
    );
};
