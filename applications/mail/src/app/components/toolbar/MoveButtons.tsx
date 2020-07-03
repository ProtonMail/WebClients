import React from 'react';
import { Location } from 'history';
import { c } from 'ttag';
import { Icon, useLoading } from 'react-components';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { MailSettings } from 'proton-shared/lib/interfaces';
import { Label } from 'proton-shared/lib/interfaces/Label';
import { Folder } from 'proton-shared/lib/interfaces/Folder';
import { toMap } from 'proton-shared/lib/helpers/object';

import ToolbarButton from './ToolbarButton';
import { getCurrentType } from '../../helpers/elements';
import { ELEMENT_TYPES } from '../../constants';
import { Breakpoints } from '../../models/utils';
import { labelIncludes, getStandardFolders } from '../../helpers/labels';
import { useMoveToFolder } from '../../hooks/useApplyLabels';

const { TRASH, SPAM, DRAFTS, ARCHIVE, SENT, INBOX, ALL_DRAFTS, ALL_SENT } = MAILBOX_LABEL_IDS;

interface Props {
    labelID: string;
    labels?: Label[];
    folders?: Folder[];
    mailSettings: MailSettings;
    breakpoints: Breakpoints;
    selectedIDs: string[];
    location: Location;
    onBack: () => void;
}

const MoveButtons = ({
    labelID = '',
    labels = [],
    folders = [],
    mailSettings,
    breakpoints,
    selectedIDs = [],
    location,
    onBack
}: Props) => {
    const [loading, withLoading] = useLoading();
    const type = getCurrentType({ mailSettings, labelID, location });
    const moveToFolder = useMoveToFolder();
    const isTypeMessage = type === ELEMENT_TYPES.MESSAGE;
    const labelIDs = labels.map(({ ID }) => ID);
    const foldersMap = toMap(folders);
    const standardFolders = getStandardFolders();

    const handleMove = async (LabelID: string) => {
        const folderName = standardFolders[LabelID]?.name || foldersMap[LabelID].Name;
        const fromLabelID = labelIDs.includes(labelID) ? INBOX : labelID;
        await moveToFolder(isTypeMessage, selectedIDs, LabelID, folderName, fromLabelID);
        onBack();
    };

    const displayInbox = !breakpoints.isNarrow && !labelIncludes(labelID, INBOX, SENT, ALL_SENT, DRAFTS, ALL_DRAFTS);

    const displayTrash = !labelIncludes(labelID, TRASH) && (!breakpoints.isNarrow || !labelIncludes(labelID, SPAM));

    const displayArchive =
        !breakpoints.isNarrow && !labelIncludes(labelID, DRAFTS, ALL_DRAFTS, SENT, ALL_SENT, ARCHIVE);

    const displaySpam = !breakpoints.isNarrow && !labelIncludes(labelID, DRAFTS, ALL_DRAFTS, SENT, ALL_SENT, SPAM);

    return (
        <>
            {displayInbox ? (
                <ToolbarButton
                    loading={loading}
                    title={c('Action').t`Move to inbox`}
                    onClick={() => withLoading(handleMove(INBOX))}
                    disabled={!selectedIDs.length}
                    data-cy="movetoinbox"
                >
                    <Icon className="toolbar-icon mauto" name="inbox" />
                </ToolbarButton>
            ) : null}
            {displayArchive ? (
                <ToolbarButton
                    loading={loading}
                    title={c('Action').t`Move to archive`}
                    onClick={() => withLoading(handleMove(ARCHIVE))}
                    disabled={!selectedIDs.length}
                    data-cy="movetoarchive"
                >
                    <Icon className="toolbar-icon mauto" name="archive" />
                </ToolbarButton>
            ) : null}
            {displaySpam ? (
                <ToolbarButton
                    loading={loading}
                    title={c('Action').t`Move to spam`}
                    onClick={() => withLoading(handleMove(SPAM))}
                    disabled={!selectedIDs.length}
                    data-cy="movetospam"
                >
                    <Icon className="toolbar-icon mauto" name="spam" />
                </ToolbarButton>
            ) : null}
            {displayTrash ? (
                <ToolbarButton
                    loading={loading}
                    title={c('Action').t`Move to trash`}
                    onClick={() => withLoading(handleMove(TRASH))}
                    disabled={!selectedIDs.length}
                    data-cy="movetotrash"
                >
                    <Icon className="toolbar-icon mauto" name="trash" />
                </ToolbarButton>
            ) : null}
        </>
    );
};

export default MoveButtons;
