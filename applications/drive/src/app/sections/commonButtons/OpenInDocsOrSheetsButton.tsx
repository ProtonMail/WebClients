import { c } from 'ttag';

import ToolbarButton from '@proton/components/components/toolbar/ToolbarButton';
import type { MimeIconComponent } from '@proton/file-icons/component';
import { MimeProtonDoc } from '@proton/file-icons/icons/MimeProtonDoc';
import { MimeProtonSheet } from '@proton/file-icons/icons/MimeProtonSheet';
import { IcArrowOutSquare } from '@proton/icons/icons/IcArrowOutSquare';
import { DOCS_APP_NAME, SHEETS_APP_NAME } from '@proton/shared/lib/constants';
import type { OpenInDocsType } from '@proton/shared/lib/helpers/mimetype';

import { ContextMenuButton } from '../../statelessComponents/ContextMenu';

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

const getTitleAndIcon = ({ type, isNative }: OpenInDocsType): { title: string; Icon: MimeIconComponent } => {
    if (type === 'spreadsheet') {
        return {
            title: isNative ? c('Action').t`Open` : c('Action: Sheets').t`Open in ${SHEETS_APP_NAME}`,
            Icon: MimeProtonSheet,
        };
    }
    return {
        title: isNative ? c('Action').t`Open` : c('Action: Docs').t`Open in ${DOCS_APP_NAME}`,
        Icon: MimeProtonDoc,
    };
};

export const OpenInDocsOrSheetsButton = ({ buttonType, onClick, close, type, isNative }: Props) => {
    const { title, Icon } = getTitleAndIcon({ type, isNative });

    if (buttonType === 'toolbar') {
        return (
            <ToolbarButton
                title={title}
                icon={isNative ? <IcArrowOutSquare alt={title} /> : <Icon alt={title} />}
                onClick={onClick}
                data-testid={`toolbar-open-${type}`}
            />
        );
    }

    if (buttonType === 'contextMenu') {
        return (
            <ContextMenuButton
                name={title}
                icon={<Icon className="mr-2" />}
                testId={`context-menu-${type}`}
                action={onClick}
                close={close}
            />
        );
    }
};
