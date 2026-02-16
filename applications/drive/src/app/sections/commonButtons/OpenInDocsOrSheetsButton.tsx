import { c } from 'ttag';

import MimeIcon from '@proton/components/components/icon/MimeIcon';
import type { MimeName } from '@proton/components/components/icon/MimeIcon';
import ToolbarButton from '@proton/components/components/toolbar/ToolbarButton';
import { DOCS_APP_NAME, SHEETS_APP_NAME } from '@proton/shared/lib/constants';
import type { OpenInDocsType } from '@proton/shared/lib/helpers/mimetype';

import { ContextMenuButton } from '../../components/sections/ContextMenu';

interface BaseProps extends OpenInDocsType {
    onClick: () => void;
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

const getTitleAndIcon = ({ type, isNative }: OpenInDocsType): { title: string; iconName: MimeName } => {
    if (type === 'spreadsheet') {
        return {
            title: isNative ? c('Action').t`Open` : c('Action: Sheets').t`Open in ${SHEETS_APP_NAME}`,
            iconName: 'proton-sheet',
        };
    }
    return {
        title: isNative ? c('Action').t`Open` : c('Action: Docs').t`Open in ${DOCS_APP_NAME}`,
        iconName: 'proton-doc',
    };
};

export const OpenInDocsOrSheetsButton = ({ buttonType, onClick, close, type, isNative }: Props) => {
    const { title, iconName } = getTitleAndIcon({ type, isNative });

    if (buttonType === 'toolbar') {
        return (
            <ToolbarButton
                title={title}
                icon={<MimeIcon name={iconName} />}
                onClick={onClick}
                data-testid={`toolbar-open-${type}`}
            />
        );
    }

    if (buttonType === 'contextMenu') {
        return (
            <ContextMenuButton
                name={title}
                icon={<MimeIcon className="mr-2" name={iconName} />}
                testId={`context-menu-${type}`}
                action={onClick}
                close={close}
            />
        );
    }
};
