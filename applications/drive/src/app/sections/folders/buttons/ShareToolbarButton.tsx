import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

interface Props {
    onClick: () => void;
}

export const ShareToolbarButton = ({ onClick }: Props) => {
    return (
        <>
            <ToolbarButton
                title={c('Action').t`Share`}
                icon={<Icon name="user-plus" alt={c('Action').t`Share`} />}
                onClick={onClick}
                data-testid="toolbar-share-via-link"
            />
        </>
    );
};
