import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import { IcFlag } from '@proton/icons/icons/IcFlag';
import { useFlag } from '@proton/unleash/useFlag';

import { ContextMenuButton } from '../../statelessComponents/ContextMenu';

interface BaseProps {
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

export const ReportAbuseButton = ({ onClick, close, buttonType }: Props) => {
    const isReportAbuseDirectShareEnabled = useFlag('DriveWebReportAbuseDirectShare');

    if (!isReportAbuseDirectShareEnabled) {
        return null;
    }

    if (buttonType === 'toolbar') {
        return (
            <ToolbarButton
                title={c('Action').t`Report abuse`}
                icon={<IcFlag alt={c('Action').t`Report abuse`} />}
                onClick={onClick}
                data-testid="toolbar-report-abuse"
            />
        );
    }

    return (
        <ContextMenuButton
            icon={<IcFlag />}
            name={c('Action').t`Report abuse`}
            action={onClick}
            close={close}
            testId="context-menu-report-abuse"
        />
    );
};
