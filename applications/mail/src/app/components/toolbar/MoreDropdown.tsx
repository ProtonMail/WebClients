import { c } from 'ttag';

import { Vr } from '@proton/atoms/Vr';
import { DropdownMenu, DropdownMenuButton, Icon } from '@proton/components';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { canMoveAll, labelIncludes } from '../../helpers/labels';
import { useEmptyLabel } from '../../hooks/actions/useEmptyLabel';
import { useMoveAll } from '../../hooks/actions/useMoveAll';
import { useLabelActions } from '../../hooks/useLabelActions';
import { Breakpoints } from '../../models/utils';
import LabelDropdown, { labelDropdownContentProps } from '../dropdown/LabelDropdown';
import MoveDropdown, { moveDropdownContentProps } from '../dropdown/MoveDropdown';
import { DropdownRender } from '../message/header/HeaderDropdown';
import ToolbarDropdown from './ToolbarDropdown';

const { DRAFTS, ALL_DRAFTS, ALL_MAIL, INBOX, SENT, ALL_SENT, ARCHIVE, STARRED, SCHEDULED, TRASH, SPAM } =
    MAILBOX_LABEL_IDS;

const canEmpty = (labelID: string, elementIDs: string[], selectedIDs: string[], isSearch: boolean) => {
    return (
        !labelIncludes(labelID, INBOX, DRAFTS, ALL_DRAFTS, STARRED, SENT, ALL_SENT, ARCHIVE, ALL_MAIL, SCHEDULED) &&
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
    onMove: (labelID: string) => void;
    onDelete: () => void;
    breakpoints: Breakpoints;
}

const MoreDropdown = ({
    labelID,
    elementIDs,
    selectedIDs,
    isSearch,
    isNarrow,
    isTiny,
    isExtraTiny,
    onMove,
    onDelete,
    breakpoints,
}: Props) => {
    let [firstActions, actions] = useLabelActions(labelID, isNarrow);
    if (isExtraTiny) {
        actions = [...firstActions, ...actions];
    }

    const { emptyLabel, modal: deleteAllModal } = useEmptyLabel();
    const { moveAll, modal: moveAllModal } = useMoveAll();

    const inMore = {
        move: actions.length > 0 && selectedIDs.length > 0,
        additionalDropdowns: isTiny && selectedIDs.length > 0,
        moveAllToArchive: canMoveAll(labelID, ARCHIVE, elementIDs, selectedIDs, isSearch),
        moveAllToTrash: canMoveAll(labelID, TRASH, elementIDs, selectedIDs, isSearch),
        delete: canEmpty(labelID, elementIDs, selectedIDs, isSearch),
    };

    const none = Object.values(inMore).every((visible) => !visible);

    if (none) {
        return null;
    }

    const handleEmptyLabel = () => emptyLabel(labelID);

    const handleMoveAllToArchive = () => moveAll(labelID, ARCHIVE);
    const handleMoveAllToTrash = () => moveAll(labelID, TRASH);

    const inbox = (
        <DropdownMenuButton
            key="context-menu-inbox"
            className="text-left"
            onClick={() => onMove(INBOX)}
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
            onClick={() => onMove(INBOX)}
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
            onClick={() => onMove(ARCHIVE)}
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
            onClick={() => onMove(TRASH)}
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
            onClick={() => onMove(SPAM)}
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
            onClick={() => onDelete()}
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
                          breakpoints={breakpoints}
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
                          breakpoints={breakpoints}
                      />
                  ),
              },
          ]
        : undefined;

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
                    render: ({ onOpenAdditionnal }) => (
                        <DropdownMenu>
                            {inMore.move ? moveButtons : null}
                            {inMore.additionalDropdowns ? (
                                <>
                                    <DropdownMenuButton
                                        className="text-left border-top"
                                        onClick={() => onOpenAdditionnal(0)}
                                        data-testid="toolbar:more-dropdown--moveto"
                                    >
                                        <Icon name="folder-arrow-in" className="mr-2" />
                                        {c('Title').t`Move to`}
                                    </DropdownMenuButton>
                                    <DropdownMenuButton
                                        className="text-left"
                                        onClick={() => onOpenAdditionnal(1)}
                                        data-testid="toolbar:more-dropdown--labelas"
                                    >
                                        <Icon name="tag" className="mr-2" />
                                        {c('Title').t`Label as`}
                                    </DropdownMenuButton>
                                </>
                            ) : null}
                            {inMore.moveAllToTrash ? (
                                <DropdownMenuButton
                                    className="text-left"
                                    onClick={handleMoveAllToTrash}
                                    data-testid="toolbar:moveAllToTrash"
                                >
                                    <Icon name="trash" className="mr-2" />
                                    {
                                        // translator: This action will move all messages from the location to trash
                                        // Beware when translating this one because we might also have a button below,
                                        // which is deleting all messages. This is different
                                        c('Action').t`Move all to trash`
                                    }
                                </DropdownMenuButton>
                            ) : null}
                            {inMore.moveAllToArchive ? (
                                <DropdownMenuButton
                                    className="text-left"
                                    onClick={handleMoveAllToArchive}
                                    data-testid="toolbar:moveAllToArchive"
                                >
                                    <Icon name="archive-box" className="mr-2" />
                                    {c('Action').t`Move all to archive`}
                                </DropdownMenuButton>
                            ) : null}
                            {inMore.delete ? (
                                <DropdownMenuButton
                                    className="text-left color-danger"
                                    onClick={handleEmptyLabel}
                                    data-testid="toolbar:more-empty"
                                >
                                    <Icon name="cross-circle" className="mr-2" />
                                    {
                                        // translator: This action will delete permanently all messages from the location
                                        // Beware when translating this one because we might also have a button on top,
                                        // which is moving messages to trash. This is different
                                        c('Action').t`Delete all`
                                    }
                                </DropdownMenuButton>
                            ) : null}
                        </DropdownMenu>
                    ),
                }}
            </ToolbarDropdown>
            <Vr />
            {deleteAllModal}
            {moveAllModal}
        </>
    );
};

export default MoreDropdown;
