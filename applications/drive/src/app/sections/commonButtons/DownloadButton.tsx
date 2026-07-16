import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import { IcArrowDownLine } from '@proton/icons/icons/IcArrowDownLine';

import { ContextMenuButton } from '../../statelessComponents/ContextMenu';

interface BaseProps {
    onClick: () => void;
    withScan?: boolean;
}

interface ContextMenuProps extends BaseProps {
    buttonType: 'contextMenu';
    close: () => void;
}

interface ToolbarProps extends BaseProps {
    buttonType: 'toolbar';
    close?: never;
}
type Props = ContextMenuProps | ToolbarProps;

export const DownloadButton = ({ buttonType, onClick, close, withScan = false }: Props) => {
    const title = withScan ? c('Action').t`Scan and Download` : c('Action').t`Download`;

    if (buttonType === 'toolbar') {
        return (
            <ToolbarButton
                title={title}
                icon={<IcArrowDownLine alt={title} />}
                onClick={onClick}
                data-testid={`toolbar-download${withScan ? '-scan' : ''}`}
            />
        );
    }

    if (buttonType === 'contextMenu') {
        return (
            <ContextMenuButton
                name={title}
                icon={<IcArrowDownLine />}
                testId={`context-menu-download${withScan ? '-scan' : ''}`}
                action={onClick}
                close={close}
            />
        );
    }
};
