import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms';
import type { LabelModel } from '@proton/components';
import { Checkbox, EditLabelModal, Icon, LabelsUpsellModal, useModalState } from '@proton/components';
import { useLoading } from '@proton/hooks';
import { useFolders, useLabels } from '@proton/mail';
import { ACCENT_COLORS } from '@proton/shared/lib/colors';
import { LABEL_TYPE, MAILBOX_LABEL_IDS, MAIL_UPSELL_PATHS } from '@proton/shared/lib/constants';
import { hasReachedFolderLimit } from '@proton/shared/lib/helpers/folder';
import { normalize } from '@proton/shared/lib/helpers/string';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import generateUID from '@proton/utils/generateUID';
import isTruthy from '@proton/utils/isTruthy';
import randomIntFromInterval from '@proton/utils/randomIntFromInterval';

import { APPLY_LOCATION_TYPES } from 'proton-mail/hooks/actions/applyLocation/interface';
import { useApplyLocation } from 'proton-mail/hooks/actions/applyLocation/useApplyLocation';
import type { FolderItem } from 'proton-mail/hooks/useMailTreeView/interface';
import { useMailFolderTreeView } from 'proton-mail/hooks/useMailTreeView/useMailFolderTreeView';

import { isElementMessage } from '../../helpers/elements';
import { getMessagesAuthorizedToMove } from '../../helpers/message/messages';
import { useMoveToFolder } from '../../hooks/actions/move/useMoveToFolder';
import { useGetElementsFromIDs, useGetMessagesOrElementsFromIDs } from '../../hooks/mailbox/useElements';
import { folderLocation } from '../list/list-telemetry/listTelemetryHelper';
import { SOURCE_ACTION } from '../list/list-telemetry/useListTelemetry';
import { MoveToDivider, MoveToDropdownButtons } from './MoveToComponents';
import { MoveToSearchInput } from './MoveToSearchInput';
import { MoveToTreeView } from './MoveToTreeView';

export const moveDropdownContentProps = { className: 'flex flex-column flex-nowrap items-stretch' };

interface Props {
    selectedIDs: string[];
    labelID: string;
    onClose: () => void;
    onLock: (lock: boolean) => void;
    isMessage?: boolean;
    selectAll?: boolean;
    onCheckAll?: (check: boolean) => void;
}

export const MoveToFolderDropdown = ({
    selectedIDs,
    labelID,
    onClose,
    onLock,
    isMessage: inputIsMessage,
    selectAll,
    onCheckAll,
}: Props) => {
    const [uid] = useState(generateUID('move-dropdown'));
    const [folders = []] = useFolders();
    const [labels = []] = useLabels();
    const [user] = useUser();
    const [loading, withLoading] = useLoading();
    const [search, setSearch] = useState('');
    const [selectedFolder, setSelectedFolder] = useState<FolderItem | null>(null);
    const [always, setAlways] = useState(false);
    const [containFocus, setContainFocus] = useState(true);
    const getElementsFromIDs = useGetElementsFromIDs();
    const getMessagesOrElements = useGetMessagesOrElementsFromIDs();
    const { moveToFolder, moveScheduledModal, moveSnoozedModal, moveToSpamModal, selectAllMoveModal } =
        useMoveToFolder(setContainFocus);
    const { applyOptimisticLocationEnabled, applyLocation } = useApplyLocation();

    const [editLabelProps, setEditLabelModalOpen, renderLabelModal] = useModalState();
    const [upsellModalProps, handleUpsellModalDisplay, renderUpsellModal] = useModalState();
    const displayedFolder = folderLocation(labelID, labels, folders);

    useEffect(() => onLock(!containFocus), [containFocus]);

    const { list: treeview } = useMailFolderTreeView();

    /*
     * When moving an element to SPAM, we want to open an "Unsubscribe modal" when items in the selections can be unsubscribed.
     * - If we're dealing with conversations, we cannot get this information from the conversation object, so we can get elements from their IDs.
     * - However, when dealing with messages, we want to check the UnsubscribeMethod field.
     *     We cannot use the getElementsFromIDs, since it will always return the element object, which does not contain this information.
     *     So in that case, we are getting the "real" Message object if found, else the element.
     */
    const elements = inputIsMessage ? getMessagesOrElements(selectedIDs) : getElementsFromIDs(selectedIDs);
    const isMessage = isElementMessage(elements[0]);
    const canMoveToInbox = isMessage
        ? !!getMessagesAuthorizedToMove(elements as Message[], MAILBOX_LABEL_IDS.INBOX).length
        : true;
    const canMoveToSpam = isMessage
        ? !!getMessagesAuthorizedToMove(elements as Message[], MAILBOX_LABEL_IDS.SPAM).length
        : true;

    const list = treeview
        .concat([
            canMoveToInbox && {
                ID: MAILBOX_LABEL_IDS.INBOX,
                Name: c('Mailbox').t`Inbox`,
                icon: 'inbox',
            },
            { ID: MAILBOX_LABEL_IDS.ARCHIVE, Name: c('Mailbox').t`Archive`, icon: 'archive-box' },
            canMoveToSpam && {
                ID: MAILBOX_LABEL_IDS.SPAM,
                Name: c('Mailbox').t`Spam`,
                icon: 'fire',
            },
            { ID: MAILBOX_LABEL_IDS.TRASH, Name: c('Mailbox').t`Trash`, icon: 'trash' },
        ] as FolderItem[])
        .filter(isTruthy)
        .filter((folder) => {
            if (!search) {
                return true;
            }

            return normalize(folder.Name, true).includes(normalize(search, true));
        });

    const actualMoveFolder = async (selectedFolderID: string, selectedFolderName: string) => {
        // If the destination folder is SPAM, we don't want to create a filter even if always is checked
        // Senders will be moved to spam anyway, but since we don't want to create filters in the "Spam case",
        // We only need to ignore the value in that scenario
        const canApplyAlways = selectedFolderID !== MAILBOX_LABEL_IDS.SPAM;

        if (applyOptimisticLocationEnabled && !selectAll) {
            await applyLocation({
                type: APPLY_LOCATION_TYPES.MOVE,
                elements,
                destinationLabelID: selectedFolderID,
                createFilters: canApplyAlways ? always : false,
            });
        } else {
            await moveToFolder({
                elements,
                sourceLabelID: labelID,
                destinationLabelID: selectedFolderID,
                folderName: selectedFolderName,
                createFilters: canApplyAlways ? always : false,
                selectAll,
                onCheckAll,
                sourceAction: SOURCE_ACTION.TOOLBAR,
                currentFolder: displayedFolder,
            });
        }
        onClose();
    };

    const handleCreate = () => {
        // Set focus state to lock the dropdown
        // We need this otherwise modal that is rendered in the dropdown will be closed if dropdown disappear from the DOM
        setContainFocus(false);
        if (hasReachedFolderLimit(user, folders)) {
            handleUpsellModalDisplay(true);
        } else {
            setEditLabelModalOpen(true);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await withLoading(actualMoveFolder(selectedFolder?.ID || '', selectedFolder?.Name || ''));
    };

    const handleSearch = (changeEvent: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(changeEvent.target.value);
    };

    const newFolder: LabelModel = {
        Name: search,
        Color: ACCENT_COLORS[randomIntFromInterval(0, ACCENT_COLORS.length - 1)],
        Type: LABEL_TYPE.MESSAGE_FOLDER,
        Notify: 1,
    };

    return (
        <form className="flex flex-column flex-nowrap justify-start items-stretch flex-auto" onSubmit={handleSubmit}>
            <div className="shrink-0 mt-6 mx-6">
                <MoveToSearchInput
                    title={c('Title').t`Move messages to`}
                    placeholder={c('Placeholder').t`Filter folders`}
                    value={search}
                    onChange={handleSearch}
                />
            </div>

            <MoveToTreeView
                treeView={list}
                search={search}
                handleSelectFolder={setSelectedFolder}
                selectedFolder={selectedFolder}
            />

            <MoveToDivider />
            <div className="px-2">
                <Button
                    fullWidth
                    onClick={handleCreate}
                    shape="ghost"
                    className="text-left flex item-start my-2"
                    data-testid="move-to-create-folder"
                    data-prevent-arrow-navigation
                >
                    <Icon name="plus" className="mr-2 mt-0.5" />
                    <span className="flex-1">{c('Action').t`Create folder`}</span>
                </Button>
            </div>

            <MoveToDivider />
            <div className="mx-4 mt-4 shrink-0">
                <Checkbox
                    id={`${uid}-always`}
                    checked={always}
                    onChange={({ target }) => setAlways(target.checked)}
                    data-testid="move-to-always-move"
                    data-prevent-arrow-navigation
                >
                    {c('Label').t`Apply to future messages`}
                </Checkbox>
            </div>
            <MoveToDropdownButtons
                loading={loading}
                disabled={selectedFolder?.ID === undefined}
                onClose={() => onClose()}
            />
            {moveScheduledModal}
            {moveSnoozedModal}
            {moveToSpamModal}
            {selectAllMoveModal}
            {renderLabelModal && (
                <EditLabelModal
                    label={newFolder}
                    type="folder"
                    onCloseCustomAction={() => setContainFocus(true)}
                    {...editLabelProps}
                />
            )}
            {renderUpsellModal && (
                <LabelsUpsellModal
                    modalProps={upsellModalProps}
                    feature={MAIL_UPSELL_PATHS.UNLIMITED_FOLDERS}
                    onCloseCustomAction={() => {
                        setContainFocus(true);
                        onClose();
                    }}
                />
            )}
        </form>
    );
};
