import type { FC } from 'react';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms';
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
            icon={loading ? <CircleLoader /> : <Icon name="window-image" alt={c('Action').t`Set as cover`} />}
            onClick={onClick}
            data-testid="toolbar-set-as-cover"
        />
    );
};
