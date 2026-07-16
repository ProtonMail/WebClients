import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';

import { noSelection } from '../../../legacy/components/sections/ToolbarButtons/utils';
import { ContextMenuButton } from '../../../statelessComponents/ContextMenu';
import type { ActionButtonProps } from '../../buttons/types';

type Item = {
    uid: string;
    name: string;
};

type Props = ActionButtonProps & {
    selectedItems: Item[];
};

export const DetailsButton = ({ selectedItems, onClick, type, close }: Props) => {
    if (noSelection(selectedItems)) {
        return null;
    }

    const title = c('Action').t`Details`;

    if (type === 'toolbar') {
        return (
            <ToolbarButton
                title={title}
                icon={<IcInfoCircle alt={title} />}
                onClick={onClick}
                data-testid="toolbar-details"
            />
        );
    }

    if (type === 'context') {
        return (
            <ContextMenuButton
                name={title}
                icon={<IcInfoCircle />}
                testId="context-menu-details"
                action={onClick}
                close={close}
            />
        );
    }
};
