import { useMemo } from 'react';

import { c } from 'ttag';

import { DropdownMenu, DropdownMenuButton, useModalState } from '@proton/components';
import { IcBell } from '@proton/icons/icons/IcBell';
import { IcFolderArrowIn } from '@proton/icons/icons/IcFolderArrowIn';
import { IcTag } from '@proton/icons/icons/IcTag';
import { IcThreeDotsHorizontal } from '@proton/icons/icons/IcThreeDotsHorizontal';
import { labelIncludes } from '@proton/mail/helpers/location';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { isConversationMode } from 'proton-mail/helpers/mailSettings';
import { useMoveAllToFolder } from 'proton-mail/hooks/actions/move/useMoveAllToFolder';
import { useEmptyLabel } from 'proton-mail/hooks/actions/useEmptyLabel';
import { useSelectAll } from 'proton-mail/hooks/useSelectAll';
import { selectLabelID } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

import { canMoveAll } from '../../helpers/labels';
import useSnooze from '../../hooks/actions/useSnooze';
import { useLabelActions } from '../../hooks/useLabelActions';
import LabelDropdown, { labelDropdownContentProps } from '../dropdown/LabelDropdown';
import MoveDropdown, { moveDropdownContentProps } from '../dropdown/MoveDropdown';
import type { SOURCE_ACTION } from '../list/list-telemetry/useListTelemetry';
import SnoozeUpsellModal from '../list/snooze/components/SnoozeUpsellModal';
import SnoozeToolbarDropdownStepWrapper, {
    SnoozeToolbarDropdownStepWrapperProps,
} from '../list/snooze/containers/SnoozeToolbarDropdownStepWrapper';
import type { DropdownRender } from '../message/extrasHeader/HeaderDropdown';
import {
    ArchiveAction,
    DeleteAction,
    DeleteAllAction,
    InboxAction,
    MoveAllToArchiveAction,
    MoveAllToTrashAction,
    NoSpamAction,
    SpamAction,
    TrashAction,
} from './MoreDropdown/MoreDropdownActions';
import ToolbarDropdown from './ToolbarDropdown';

const canEmpty = (labelID: string, elementIDs: string[], selectedIDs: string[], isSearch: boolean) => {
    return (
        !labelIncludes(
            labelID,
            MAILBOX_LABEL_IDS.INBOX,
            MAILBOX_LABEL_IDS.DRAFTS,
            MAILBOX_LABEL_IDS.ALL_DRAFTS,
            MAILBOX_LABEL_IDS.STARRED,
            MAILBOX_LABEL_IDS.SENT,
            MAILBOX_LABEL_IDS.ALL_SENT,
            MAILBOX_LABEL_IDS.ARCHIVE,
            MAILBOX_LABEL_IDS.ALL_MAIL,
            MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
            MAILBOX_LABEL_IDS.SCHEDULED
        ) &&
        elementIDs.length > 0 &&
        selectedIDs.length === 0 &&
        !isSearch
    );
};

interface Props {
    elementIDs: string[];
    selectedIDs: string[];
    isSearch: boolean;
    isNarrow: boolean;
    isTiny: boolean;
    isExtraTiny: boolean;
    onMove: (labelID: string, sourceAction: SOURCE_ACTION) => void;
    onDelete: (sourceAction: SOURCE_ACTION) => void;
    onCheckAll?: (check: boolean) => void;
}

const MoreDropdown = ({
    elementIDs,
    selectedIDs,
    isSearch,
    isTiny,
    isExtraTiny,
    onMove,
    onDelete,
    onCheckAll,
}: Props) => {
    const labelID = useMailSelector(selectLabelID);

    const { moveAllToFolder, moveAllModal } = useMoveAllToFolder();
    const { emptyLabel, modal: deleteAllModal } = useEmptyLabel();

    const [mailSettings] = useMailSettings();
    const { selectAll } = useSelectAll({ labelID });

    let [firstActions, actions] = useLabelActions(labelID);
    if (isExtraTiny) {
        actions = [...firstActions, ...actions];
    }

    const { canSnooze, canUnsnooze } = useSnooze();

    const [upsellModalProps, handleUpsellModalDisplay, renderUpsellModal] = useModalState();

    const showMove = actions.length > 0 && selectedIDs.length > 0;
    const showAdditionalDropdowns = isTiny && selectedIDs.length > 0;
    const showMoveAllToArchive = canMoveAll(labelID, MAILBOX_LABEL_IDS.ARCHIVE, elementIDs, selectedIDs, isSearch);
    const showMoveAllToTrash = canMoveAll(labelID, MAILBOX_LABEL_IDS.TRASH, elementIDs, selectedIDs, isSearch);
    const showDelete = canEmpty(labelID, elementIDs, selectedIDs, isSearch);
    const none = !showMove && !showAdditionalDropdowns && !showMoveAllToArchive && !showMoveAllToTrash && !showDelete;

    const additionalDropdowns: DropdownRender[] = [];
    if (showAdditionalDropdowns) {
        additionalDropdowns.push({
            contentProps: moveDropdownContentProps,
            render: ({ onClose, onLock }) => (
                <MoveDropdown
                    labelID={labelID}
                    selectedIDs={selectedIDs}
                    onClose={onClose}
                    onLock={onLock}
                    isMessage={!isConversationMode(labelID, mailSettings)}
                    selectAll={selectAll}
                    onCheckAll={onCheckAll}
                />
            ),
        });

        additionalDropdowns.push({
            contentProps: labelDropdownContentProps,
            render: ({ onClose, onLock }) => (
                <LabelDropdown
                    labelID={labelID}
                    selectedIDs={selectedIDs}
                    onClose={onClose}
                    onLock={onLock}
                    selectAll={selectAll}
                />
            ),
        });
    }

    if (selectedIDs.length && (canSnooze || canUnsnooze)) {
        additionalDropdowns.push({
            contentProps: SnoozeToolbarDropdownStepWrapperProps,
            render: ({ onClose, onLock }) => (
                <SnoozeToolbarDropdownStepWrapper
                    onClose={onClose}
                    onLock={onLock}
                    selectedIDs={selectedIDs}
                    displayUpsellModal={() => handleUpsellModalDisplay(true)}
                />
            ),
        });
    }

    const allMoveButtons = useMemo(
        () => ({
            inbox: <InboxAction onMove={onMove} />,
            trash: <TrashAction onMove={onMove} />,
            archive: <ArchiveAction onMove={onMove} />,
            spam: <SpamAction onMove={onMove} />,
            nospam: <NoSpamAction onMove={onMove} />,
            delete: <DeleteAction onDelete={onDelete} />,
        }),
        [onMove, onDelete]
    );

    return (
        <>
            <ToolbarDropdown
                title={c('Action').t`More`}
                content={<IcThreeDotsHorizontal className="toolbar-icon" alt={c('Action').t`More`} />}
                data-testid="toolbar:more-dropdown"
                hasCaret={false}
                additionalDropdowns={additionalDropdowns}
                className={none ? 'visibility-hidden' : ''}
                disabled={none}
            >
                {{
                    render: ({ onOpenAdditional }) => (
                        <DropdownMenu>
                            {showMove ? actions.map((action) => allMoveButtons[action]) : null}
                            {showAdditionalDropdowns ? (
                                <>
                                    <DropdownMenuButton
                                        className={clsx('text-left inline-flex flex-nowrap', showMove && 'border-top')}
                                        onClick={() => onOpenAdditional(0)}
                                        data-testid="toolbar:more-dropdown--moveto"
                                    >
                                        <IcFolderArrowIn className="mr-2 shrink-0 mt-0.5" />
                                        <span className="flex-1">{c('Title').t`Move to`}</span>
                                    </DropdownMenuButton>
                                    <DropdownMenuButton
                                        className="text-left inline-flex flex-nowrap"
                                        onClick={() => onOpenAdditional(1)}
                                        data-testid="toolbar:more-dropdown--labelas"
                                    >
                                        <IcTag className="mr-2 shrink-0 mt-0.5" />
                                        <span className="flex-1">{c('Title').t`Label as`}</span>
                                    </DropdownMenuButton>
                                    {(canSnooze || canUnsnooze) && (
                                        <DropdownMenuButton
                                            className="text-left inline-flex flex-nowrap"
                                            onClick={() => onOpenAdditional(2)}
                                            data-testid="toolbar:more-dropdown--snooze"
                                        >
                                            <IcBell className="mr-2 shrink-0 mt-0.5" />
                                            <span className="flex-1">{c('Title').t`Snooze message`}</span>
                                        </DropdownMenuButton>
                                    )}
                                </>
                            ) : null}

                            {showMoveAllToTrash ? (
                                <MoveAllToTrashAction labelID={labelID} moveAllToFolder={moveAllToFolder} />
                            ) : null}
                            {showMoveAllToArchive ? (
                                <MoveAllToArchiveAction labelID={labelID} moveAllToFolder={moveAllToFolder} />
                            ) : null}
                            {showDelete ? <DeleteAllAction labelID={labelID} emptyLabel={emptyLabel} /> : null}
                        </DropdownMenu>
                    ),
                }}
            </ToolbarDropdown>
            {renderUpsellModal && <SnoozeUpsellModal {...upsellModalProps} />}
            {moveAllModal}
            {deleteAllModal}
        </>
    );
};

export default MoreDropdown;
