import type { FC, ReactNode } from 'react';

import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

interface Props {
    onClick: () => void;
    children: ReactNode;
}

export const PhotosClearSelectionButton: FC<Props> = ({ onClick, children }) => {
    return (
        <ToolbarButton
            title={c('Action').t`Clear selection`}
            onClick={onClick}
            data-testid="toolbar-clear-selection"
            className="inline-flex flex-nowrap flex-row items-center ml-2 border px-2 py-1"
        >
            <Icon name="cross-big" className="mr-2" /> {children}
        </ToolbarButton>
    );
};
