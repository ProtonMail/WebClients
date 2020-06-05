import React from 'react';
import {
    Icon,
    useLoading,
    useNotifications,
    useEventManager,
    useApi,
    ConfirmModal,
    ErrorButton,
    useModals,
    Alert
} from 'react-components';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { emptyLabel } from 'proton-shared/lib/api/messages';
import { c } from 'ttag';

import ToolbarButton from './ToolbarButton';
import ToolbarSeparator from './ToolbarSeparator';
import { Breakpoints } from '../../models/utils';
import { labelIncludes } from '../../helpers/labels';
import { Element } from '../../models/element';

const { DRAFTS, ALL_DRAFTS, ALL_MAIL, INBOX, SENT, ALL_SENT, ARCHIVE, STARRED } = MAILBOX_LABEL_IDS;

interface Props {
    labelID: string;
    breakpoints: Breakpoints;
    elements: Element[];
}

const EmptyButton = ({ labelID = '', breakpoints, elements }: Props) => {
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const { call } = useEventManager();
    const api = useApi();
    const [loading, withLoading] = useLoading();

    const displayEmpty =
        !breakpoints.isNarrow &&
        !labelIncludes(labelID, INBOX, DRAFTS, ALL_DRAFTS, STARRED, SENT, ALL_SENT, ARCHIVE, ALL_MAIL);

    const handleEmpty = async () => {
        await new Promise((resolve, reject) => {
            createModal(
                <ConfirmModal
                    title={c('Title').t`Empty folder`}
                    confirm={(<ErrorButton type="submit" icon={null}>{c('Action').t`Empty`}</ErrorButton>) as any}
                    onConfirm={resolve}
                    onClose={reject}
                >
                    <Alert type="warning">{c('Info')
                        .t`This action will permanently delete your emails. Are you sure you want to empty this folder?`}</Alert>
                </ConfirmModal>
            );
        });
        await api(emptyLabel({ LabelID: labelID, AddressID: undefined }));
        await call();
        createNotification({ text: c('Success').t`Folder cleared` });
    };

    if (!displayEmpty) {
        return null;
    }

    return (
        <>
            <ToolbarSeparator />
            <ToolbarButton
                disabled={!elements.length}
                loading={loading}
                title={c('Action').t`Empty folder`}
                onClick={() => withLoading(handleEmpty())}
            >
                <Icon className="toolbar-icon mauto" name="empty-folder" />
            </ToolbarButton>
        </>
    );
};

export default EmptyButton;
