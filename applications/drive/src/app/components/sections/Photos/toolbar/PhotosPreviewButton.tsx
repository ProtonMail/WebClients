import type { FC } from 'react';

import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

interface Props {
    onClick: () => void;
}

export const PhotosPreviewButton: FC<Props> = ({ onClick }) => {
    return (
        <ToolbarButton
            title={c('Action').t`Preview`}
            icon={<Icon name="eye" alt={c('Action').t`Preview`} />}
            onClick={onClick}
            data-testid="toolbar-preview"
        />
    );
};
