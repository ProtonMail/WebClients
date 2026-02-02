import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import { IcUserPlus } from '@proton/icons/icons/IcUserPlus';

interface Props {
    onClick: () => void;
}

export const ShareToolbarButton = ({ onClick }: Props) => {
    return (
        <ToolbarButton
            title={c('Action').t`Share`}
            icon={<IcUserPlus alt={c('Action').t`Share`} />}
            onClick={onClick}
            data-testid="toolbar-share-via-link"
        />
    );
};
