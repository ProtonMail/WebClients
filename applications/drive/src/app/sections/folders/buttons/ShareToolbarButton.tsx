import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import { IcUserPlus } from '@proton/icons/icons/IcUserPlus';

interface Props {
    onClick: () => void;
}

export const ShareToolbarButton = ({ onClick }: Props) => {
    const title = c('Action').t`Share`;

    return (
        <ToolbarButton
            title={title}
            icon={<IcUserPlus alt={title} />}
            onClick={onClick}
            data-testid="toolbar-share-via-link"
        />
    );
};
