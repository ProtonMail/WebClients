import { c } from 'ttag';

import { DropdownMenu, DropdownMenuButton, Icon, useModalState } from '@proton/components';
import { labelIncludes } from '@proton/mail/helpers/location';
import { TelemetryMailSelectAllEvents } from '@proton/shared/lib/api/telemetry';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { isConversationMode } from 'proton-mail/helpers/mailSettings';
import { MoveAllType, useMoveAllToFolder } from 'proton-mail/hooks/actions/move/useMoveAllToFolder';
import useMailModel from 'proton-mail/hooks/useMailModel';
import { useSelectAll } from 'proton-mail/hooks/useSelectAll';

import { canMoveAll } from '../../helpers/labels';
import { useEmptyLabel } from '../../hooks/actions/useEmptyLabel';
import useSnooze from '../../hooks/actions/useSnooze';
import { useLabelActions } from '../../hooks/useLabelActions';
import LabelDropdown, { labelDropdownContentProps } from '../dropdown/LabelDropdown';
import MoveDropdown, { moveDropdownContentProps } from '../dropdown/MoveDropdown';
import useListTelemetry, { ACTION_TYPE, SELECTED_RANGE, SOURCE_ACTION } from '../list/list-telemetry/useListTelemetry';
import SnoozeUpsellModal from '../list/snooze/components/SnoozeUpsellModal';
import SnoozeToolbarDropdownStepWrapper, {
    SnoozeToolbarDropdownStepWrapperProps,
} from '../list/snooze/containers/SnoozeToolbarDropdownStepWrapper';
import { type DropdownRender } from '../message/extrasHeader/HeaderDropdown';
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
    labelID: string;
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
    labelID,
    elementIDs,
    selectedIDs,
    isSearch,
    isTiny,
    isExtraTiny,
    onMove,
    onDelete,
    onCheckAll,
}: Props) => {
    const mailSettings = useMailModel('MailSettings');
    const { selectAll } = useSelectAll({ labelID });
    let [firstActions, actions] = useLabelActions(labelID);
    if (isExtraTiny) {
        actions = [...firstActions, ...actions];
    }

    const { canSnooze, canUnsnooze } = useSnooze();

    const { emptyLabel, modal: deleteAllModal } = useEmptyLabel();
    const { moveAllToFolder, moveAllModal } = useMoveAllToFolder();

    const { sendSimpleActionReport } = useListTelemetry();

    const [upsellModalProps, handleUpsellModalDisplay, renderUpsellModal] = useModalState();

    const inMore = {
        move: actions.length > 0 && selectedIDs.length > 0,
        additionalDropdowns: isTiny && selectedIDs.length > 0,
        moveAllToArchive: canMoveAll(labelID, MAILBOX_LABEL_IDS.ARCHIVE, elementIDs, selectedIDs, isSearch),
        moveAllToTrash: canMoveAll(labelID, MAILBOX_LABEL_IDS.TRASH, elementIDs, selectedIDs, isSearch),
        delete: canEmpty(labelID, elementIDs, selectedIDs, isSearch),
    };

    const none = Object.values(inMore).every((visible) => !visible);

    if (none) {
        return null;
    }

    const handleEmptyLabel = () => {
        sendSimpleActionReport({
            actionType: ACTION_TYPE.DELETE_PERMANENTLY,
            actionLocation: SOURCE_ACTION.TOOLBAR,
            numberMessage: SELECTED_RANGE.ALL,
        });
        void emptyLabel(labelID);
    };

    const handleMoveAllToArchive = () => {
        void moveAllToFolder({
            type: MoveAllType.moveAll,
            sourceLabelID: labelID,
            destinationLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
            telemetryEvent: TelemetryMailSelectAllEvents.button_move_to_archive,
            sourceAction: SOURCE_ACTION.MORE_DROPDOWN,
        });
    };
    const handleMoveAllToTrash = () => {
        void moveAllToFolder({
            type: MoveAllType.moveAll,
            sourceLabelID: labelID,
            destinationLabelID: MAILBOX_LABEL_IDS.TRASH,
            telemetryEvent: TelemetryMailSelectAllEvents.button_move_to_trash,
            sourceAction: SOURCE_ACTION.MORE_DROPDOWN,
        });
    };

    const inbox = (
        <DropdownMenuButton
            key="context-menu-inbox"
            className="text-left"
            onClick={() => onMove(MAILBOX_LABEL_IDS.INBOX, SOURCE_ACTION.TOOLBAR)}
            data-testid="toolbar:more-dropdown--movetoinbox"
        >
            <Icon name="inbox" className="mr-2" />
            {c('Action').t`Move to inbox`}
        </DropdownMenuButton>
    );

    const nospam = (
        <DropdownMenuButton
            key="context-menu-nospam"
            className="text-left"
            onClick={() => onMove(MAILBOX_LABEL_IDS.INBOX, SOURCE_ACTION.TOOLBAR)}
            data-testid="toolbar:more-dropdown--movetonospam"
        >
            <Icon name="fire-slash" className="mr-2" />
            {c('Action').t`Move to inbox (not spam)`}
        </DropdownMenuButton>
    );

    const archive = (
        <DropdownMenuButton
            key="context-menu-archive"
            className="text-left"
            onClick={() => onMove(MAILBOX_LABEL_IDS.ARCHIVE, SOURCE_ACTION.TOOLBAR)}
            data-testid="toolbar:more-dropdown--movetonoarchive"
        >
            <Icon name="archive-box" className="mr-2" />
            {c('Action').t`Move to archive`}
        </DropdownMenuButton>
    );

    const trash = (
        <DropdownMenuButton
            key="context-menu-trash"
            className="text-left"
            onClick={() => onMove(MAILBOX_LABEL_IDS.TRASH, SOURCE_ACTION.TOOLBAR)}
            data-testid="toolbar:more-dropdown--movetotrash"
        >
            <Icon name="trash" className="mr-2" />
            {c('Action').t`Move to trash`}
        </DropdownMenuButton>
    );

    const spam = (
        <DropdownMenuButton
            key="context-menu-spam"
            className="text-left"
            onClick={() => onMove(MAILBOX_LABEL_IDS.SPAM, SOURCE_ACTION.TOOLBAR)}
            data-testid="toolbar:more-dropdown--movetospam"
        >
            <Icon name="fire" className="mr-2" />
            {c('Action').t`Move to spam`}
        </DropdownMenuButton>
    );

    const deleteButton = (
        <DropdownMenuButton
            key="context-menu-delete"
            className="text-left"
            onClick={() => onDelete(SOURCE_ACTION.TOOLBAR)}
            data-testid="toolbar:more-dropdown--delete"
        >
            <Icon name="cross-circle" className="mr-2" />
            {c('Action').t`Delete`}
        </DropdownMenuButton>
    );

    const allMoveButtons = { inbox, trash, archive, spam, nospam, delete: deleteButton };
    const moveButtons = actions.map((action) => allMoveButtons[action]);

    const additionalDropdowns: DropdownRender[] | undefined = inMore.additionalDropdowns
        ? [
              {
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
              },
              {
                  contentProps: labelDropdownContentProps,
                  render: ({ onClose, onLock }) => (
                      <LabelDropdown
                          labelID={labelID}
                          selectedIDs={selectedIDs}
                          onClose={onClose}
                          onLock={onLock}
                          selectAll={selectAll}
                          onCheckAll={onCheckAll}
                      />
                  ),
              },
          ]
        : undefined;

    if (selectedIDs.length && (canSnooze || canUnsnooze)) {
        additionalDropdowns?.push({
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

    return (
        <>
            <ToolbarDropdown
                title={c('Action').t`More`}
                content={<Icon className="toolbar-icon" name="three-dots-horizontal" alt={c('Action').t`More`} />}
                data-testid="toolbar:more-dropdown"
                hasCaret={false}
                additionalDropdowns={additionalDropdowns}
            >
                {{
                    render: ({ onOpenAdditional }) => (
                        <DropdownMenu>
                            {inMore.move ? moveButtons : null}
                            {inMore.additionalDropdowns ? (
                                <>
                                    <DropdownMenuButton
                                        className={clsx(
                                            'text-left inline-flex flex-nowrap',
                                            inMore.move && 'border-top'
                                        )}
                                        onClick={() => onOpenAdditional(0)}
                                        data-testid="toolbar:more-dropdown--moveto"
                                    >
                                        <Icon name="folder-arrow-in" className="mr-2 shrink-0 mt-0.5" />
                                        <span className="flex-1">{c('Title').t`Move to`}</span>
                                    </DropdownMenuButton>
                                    <DropdownMenuButton
                                        className="text-left inline-flex flex-nowrap"
                                        onClick={() => onOpenAdditional(1)}
                                        data-testid="toolbar:more-dropdown--labelas"
                                    >
                                        <Icon name="tag" className="mr-2 shrink-0 mt-0.5" />
                                        <span className="flex-1">{c('Title').t`Label as`}</span>
                                    </DropdownMenuButton>
                                    {(canSnooze || canUnsnooze) && (
                                        <DropdownMenuButton
                                            className="text-left inline-flex flex-nowrap"
                                            onClick={() => onOpenAdditional(2)}
                                            data-testid="toolbar:more-dropdown--snooze"
                                        >
                                            <Icon name="bell" className="mr-2 shrink-0 mt-0.5" />
                                            <span className="flex-1">{c('Title').t`Snooze message`}</span>
                                        </DropdownMenuButton>
                                    )}
                                </>
                            ) : null}
                            {inMore.moveAllToTrash ? (
                                <DropdownMenuButton
                                    className="text-left inline-flex flex-nowrap"
                                    onClick={handleMoveAllToTrash}
                                    data-testid="toolbar:moveAllToTrash"
                                >
                                    <Icon name="trash" className="mr-2 shrink-0 mt-0.5" />
                                    <span className="flex-1">
                                        {
                                            // translator: This action will move all messages from the location to trash
                                            // Beware when translating this one because we might also have a button below,
                                            // which is deleting all messages. This is different
                                            c('Action').t`Move all to trash`
                                        }
                                    </span>
                                </DropdownMenuButton>
                            ) : null}
                            {inMore.moveAllToArchive ? (
                                <DropdownMenuButton
                                    className="text-left inline-flex flex-nowrap"
                                    onClick={handleMoveAllToArchive}
                                    data-testid="toolbar:moveAllToArchive"
                                >
                                    <Icon name="archive-box" className="mr-2 shrink-0 mt-0.5" />
                                    <span className="flex-1">{c('Action').t`Move all to archive`}</span>
                                </DropdownMenuButton>
                            ) : null}
                            {inMore.delete ? (
                                <DropdownMenuButton
                                    className="text-left inline-flex flex-nowrap color-danger"
                                    onClick={handleEmptyLabel}
                                    data-testid="toolbar:more-empty"
                                >
                                    <Icon name="cross-circle" className="mr-2 shrink-0 mt-0.5" />
                                    <span className="flex-1">{
                                        // translator: This action will delete permanently all messages from the location
                                        // Beware when translating this one because we might also have a button on top,
                                        // which is moving messages to trash. This is different
                                        c('Action').t`Delete all`
                                    }</span>
                                </DropdownMenuButton>
                            ) : null}
                        </DropdownMenu>
                    ),
                }}
            </ToolbarDropdown>
            {deleteAllModal}
            {moveAllModal}
            {renderUpsellModal && <SnoozeUpsellModal {...upsellModalProps} />}
        </>
    );
};

export default MoreDropdown;
