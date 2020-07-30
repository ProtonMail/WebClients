import React from 'react';
import { MESSAGE_BUTTONS } from 'proton-shared/lib/constants';
import { Icon, useLoading } from 'react-components';
import { c } from 'ttag';

import ToolbarButton from './ToolbarButton';

import { Element } from '../../models/element';
import { useMarkAs, MARK_AS_STATUS } from '../../hooks/useMarkAs';

const { READ, UNREAD } = MARK_AS_STATUS;

interface Props {
    labelID: string;
    mailSettings: any;
    selectedIDs: string[];
    onBack: () => void;
    elements: Element[];
}

const ReadUnreadButtons = ({ labelID, mailSettings, elements, selectedIDs = [], onBack }: Props) => {
    const { MessageButtons = MESSAGE_BUTTONS.READ_UNREAD } = mailSettings;
    const [loading, withLoading] = useLoading();
    const markAs = useMarkAs();

    const handleMarkAs = async (status: MARK_AS_STATUS) => {
        const isUnread = status === UNREAD;

        const selectedElements = selectedIDs.map((ID: string) => {
            return elements.find((e: Element) => e.ID === ID) as Element;
        });
        if (isUnread) {
            onBack();
        }
        await markAs(selectedElements, labelID, status);
    };

    const buttons = [
        <ToolbarButton
            key="read"
            title={c('Action').t`Mark as read`}
            loading={loading}
            disabled={!selectedIDs.length}
            onClick={() => withLoading(handleMarkAs(READ))}
            className="notablet nomobile"
            data-test-id="toolbar:read"
        >
            <Icon className="toolbar-icon mauto" name="read" />
            <span className="sr-only">{c('Action').t`Mark as read`}</span>
        </ToolbarButton>,
        <ToolbarButton
            key="unread"
            title={c('Action').t`Mark as unread`}
            loading={loading}
            disabled={!selectedIDs.length}
            onClick={() => withLoading(handleMarkAs(UNREAD))}
            data-test-id="toolbar:unread"
        >
            <Icon className="toolbar-icon mauto" name="unread" />
            <span className="sr-only">{c('Action').t`Mark as unread`}</span>
        </ToolbarButton>
    ];

    if (MessageButtons === MESSAGE_BUTTONS.UNREAD_READ) {
        buttons.reverse();
    }

    // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/20356
    return <>{buttons}</>;
};

export default ReadUnreadButtons;
