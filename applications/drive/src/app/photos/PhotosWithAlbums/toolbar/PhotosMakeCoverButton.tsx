import type { FC } from 'react';

import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import noop from '@proton/utils/noop';

interface Props {
    onSelectCover: () => Promise<void>;
}

export const PhotosMakeCoverButton: FC<Props> = ({ onSelectCover }) => {
    const [loading, withLoading] = useLoading();

    const onClick = () => {
        withLoading(onSelectCover()).catch(noop);
    };

    return (
        <ToolbarButton
            title={c('Action').t`Set as cover`}
            disabled={loading}
            onClick={onClick}
            data-testid="toolbar-set-as-cover"
        >
            <Icon name="window-image" className="mr-2" />
            <span>{c('Action').t`Set as cover`}</span>
        </ToolbarButton>
    );
};
