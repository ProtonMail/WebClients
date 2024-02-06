import { useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { Breakpoints, IconName } from '@proton/components';
import {
    Checkbox,
    FolderIcon,
    Icon,
    LabelsUpsellModal,
    Mark,
    PrimaryButton,
    Radio,
    SearchInput,
    Tooltip,
    generateUID,
    useFolders,
    useModalState,
    useUser,
} from '@proton/components';
import type { LabelModel } from '@proton/components/containers/labels/modals/EditLabelModal';
import EditLabelModal from '@proton/components/containers/labels/modals/EditLabelModal';
import { useLoading } from '@proton/hooks';
import { ACCENT_COLORS } from '@proton/shared/lib/colors';
import { LABEL_TYPE, MAILBOX_LABEL_IDS, MAIL_UPSELL_PATHS } from '@proton/shared/lib/constants';
import { buildTreeview, hasReachedFolderLimit } from '@proton/shared/lib/helpers/folder';
import { normalize } from '@proton/shared/lib/helpers/string';
import type { Folder, FolderWithSubFolders } from '@proton/shared/lib/interfaces/Folder';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';
import randomIntFromInterval from '@proton/utils/randomIntFromInterval';

import { isMessage as testIsMessage } from '../../helpers/elements';
import { getMessagesAuthorizedToMove } from '../../helpers/message/messages';
import { useMoveToFolder } from '../../hooks/actions/move/useMoveToFolder';
import { useCreateFilters } from '../../hooks/actions/useCreateFilters';
import { useGetElementsFromIDs, useGetMessagesOrElementsFromIDs } from '../../hooks/mailbox/useElements';

import './MoveDropdown.scss';

export const moveDropdownContentProps = { className: 'flex flex-column flex-nowrap items-stretch' };

type FolderItem = Folder & { icon: IconName; level: number };

const { INBOX, TRASH, SPAM, ARCHIVE } = MAILBOX_LABEL_IDS;

const folderReducer = (acc: FolderItem[], folder: FolderWithSubFolders, level = 0): FolderItem[] => {
    acc.push({
        ...folder,
        Name: folder.Name,
        icon: folder.subfolders?.length ? 'folders' : 'folder',
        level,
    });

    if (Array.isArray(folder.subfolders)) {
        folder.subfolders.forEach((folder: FolderWithSubFolders) => folderReducer(acc, folder, level + 1));
    }

    return acc;
};

interface Props {
    selectedIDs: string[];
    labelID: string;
    onClose: () => void;
    onLock: (lock: boolean) => void;
    breakpoints: Breakpoints;
    isMessage?: boolean;
    selectAll?: boolean;
    onCheckAll?: (check: boolean) => void;
}

const MoveDropdown = ({
    selectedIDs,
    labelID,
    onClose,
    onLock,
    breakpoints,
    isMessage: inputIsMessage,
    selectAll,
    onCheckAll,
}: Props) => {
    const [uid] = useState(generateUID('move-dropdown'));
    const [folders = []] = useFolders();
    const [user] = useUser();
    const [loading, withLoading] = useLoading();
    const [search, updateSearch] = useState('');
    const [selectedFolder, setSelectedFolder] = useState<Folder | undefined>();
    const [always, setAlways] = useState(false);
    const [containFocus, setContainFocus] = useState(true);
    const normSearch = normalize(search, true);
    const getElementsFromIDs = useGetElementsFromIDs();
    const getMessagesOrElements = useGetMessagesOrElementsFromIDs();
    const { moveToFolder, moveScheduledModal, moveSnoozedModal, moveToSpamModal, selectAllMoveModal } =
        useMoveToFolder(setContainFocus);
    const { getSendersToFilter } = useCreateFilters();

    const [editLabelProps, setEditLabelModalOpen, renderLabelModal] = useModalState();
    const [upsellModalProps, handleUpsellModalDisplay, renderUpsellModal] = useModalState();

    useEffect(() => onLock(!containFocus), [containFocus]);

    const treeview = buildTreeview(folders);

    /*
     * When moving an element to SPAM, we want to open an "Unsubscribe modal" when items in the selections can be unsubscribed.
     * - If we're dealing with conversations, we cannot get this information from the conversation object, so we can get elements from their IDs.
     * - However, when dealing with messages, we want to check the UnsubscribeMethod field.
     *     We cannot use the getElementsFromIDs, since it will always return the element object, which does not contain this information.
     *     So in that case, we are getting the "real" Message object if found, else the element.
     */
    const elements = inputIsMessage ? getMessagesOrElements(selectedIDs) : getElementsFromIDs(selectedIDs);
    const isMessage = testIsMessage(elements[0]);
    const canMoveToInbox = isMessage ? !!getMessagesAuthorizedToMove(elements as Message[], INBOX).length : true;
    const canMoveToSpam = isMessage ? !!getMessagesAuthorizedToMove(elements as Message[], SPAM).length : true;

    /*
     * translator: Text displayed in a button to suggest the creation of a new folder in the move dropdown
     * This button is shown when the user search for a folder which doesn't exist
     * ${search} is a string containing the search the user made in the folder dropdown
     * Full sentence for reference: 'Create folder "Dunder Mifflin"'
     */
    const createFolderButtonText = c('Title').t`Create folder "${search}"`;

    const alwaysCheckboxDisabled = useMemo(() => {
        return !getSendersToFilter(elements).length || !selectedFolder || !!selectAll;
    }, [getSendersToFilter, elements, selectAll]);

    const list = treeview
        .reduce<FolderItem[]>((acc, folder) => folderReducer(acc, folder), [])
        .concat([
            canMoveToInbox && {
                ID: INBOX,
                Name: c('Mailbox').t`Inbox`,
                icon: 'inbox',
            },
            { ID: ARCHIVE, Name: c('Mailbox').t`Archive`, icon: 'archive-box' },
            canMoveToSpam && {
                ID: SPAM,
                Name: c('Mailbox').t`Spam`,
                icon: 'fire',
            },
            { ID: TRASH, Name: c('Mailbox').t`Trash`, icon: 'trash' },
        ] as FolderItem[])
        .filter(isTruthy)
        .filter(({ Name = '' }: { Name: string }) => {
            if (!search) {
                return true;
            }
            const normName = normalize(Name, true);
            return normName.includes(normSearch);
        });

    const actualMoveFolder = async (selectedFolderID: string, selectedFolderName: string) => {
        // If the destination folder is SPAM, we don't want to create a filter even if always is checked
        // Senders will be moved to spam anyway, but since we don't want to create filters in the "Spam case",
        // We only need to ignore the value in that scenario
        const canApplyAlways = selectedFolderID !== SPAM;

        await moveToFolder({
            elements,
            sourceLabelID: labelID,
            destinationLabelID: selectedFolderID,
            folderName: selectedFolderName,
            createFilters: canApplyAlways ? always : false,
            selectAll,
            onCheckAll,
        });
        onClose();
    };

    const handleMove = async () => {
        await actualMoveFolder(selectedFolder?.ID || '', selectedFolder?.Name || '');
    };

    const handleApplyDirectly = async (selectedFolderID: string, selectedFolderName: string) => {
        await actualMoveFolder(selectedFolderID, selectedFolderName);
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
        await withLoading(handleMove());
    };

    // The dropdown is several times in the view, native html ids has to be different each time
    const searchInputID = `${uid}-search`;
    const alwaysCheckID = `${uid}-always`;
    const folderButtonID = (ID: string) => `${uid}-${ID}`;
    const autoFocusSearch = !breakpoints.viewportWidth['<=small'];
    const applyDisabled = selectedFolder?.ID === undefined;

    const newFolder: LabelModel = {
        Name: search,
        Color: ACCENT_COLORS[randomIntFromInterval(0, ACCENT_COLORS.length - 1)],
        Type: LABEL_TYPE.MESSAGE_FOLDER,
        Notify: 1,
    };

    return (
        <form className="flex flex-column flex-nowrap justify-start items-stretch flex-auto" onSubmit={handleSubmit}>
            <div className="flex shrink-0 justify-space-between items-center m-4 mb-0">
                <span className="text-bold" tabIndex={-2}>
                    {c('Label').t`Move to`}
                </span>
                <Tooltip title={c('Title').t`Create folder`}>
                    <Button
                        icon
                        color="norm"
                        size="small"
                        onClick={handleCreate}
                        className="flex items-center"
                        data-testid="folder-dropdown:add-folder"
                        data-prevent-arrow-navigation
                    >
                        <Icon name="folder" /> +
                    </Button>
                </Tooltip>
            </div>
            <div className="shrink-0 m-4 mb-0">
                <SearchInput
                    value={search}
                    onChange={updateSearch}
                    id={searchInputID}
                    placeholder={c('Placeholder').t`Filter folders`}
                    autoFocus={autoFocusSearch}
                    data-testid="folder-dropdown:search-folder"
                    data-prevent-arrow-navigation
                />
            </div>
            <div className="move-dropdown-list overflow-auto mt-4 flex-auto" data-testid="move-dropdown-list">
                <ul className="unstyled my-0">
                    {list.map((folder: FolderItem) => {
                        return (
                            <li
                                key={folder.ID}
                                className="dropdown-item dropdown-item-button relative cursor-pointer w-full flex flex-nowrap items-center py-2 px-4"
                            >
                                <Radio
                                    className="shrink-0 mr-2"
                                    id={folderButtonID(folder.ID)}
                                    name={uid}
                                    checked={selectedFolder?.ID === folder.ID}
                                    onChange={() => setSelectedFolder(folder)}
                                    data-testid={`label-dropdown:folder-radio-${folder.Name}`}
                                />
                                <label
                                    htmlFor={folderButtonID(folder.ID)}
                                    data-level={folder.level}
                                    className="flex flex-nowrap items-center flex-1"
                                    data-testid={`folder-dropdown:folder-${folder.Name}`}
                                    onClick={() => handleApplyDirectly(folder.ID, folder.Name)}
                                >
                                    <FolderIcon folder={folder} name={folder.icon} className="shrink-0 mr-2" />
                                    <span className="text-ellipsis" title={folder.Name}>
                                        <Mark value={search}>{folder.Name}</Mark>
                                    </span>
                                </label>
                            </li>
                        );
                    })}
                    {list.length === 0 && !search && (
                        <li key="empty" className="dropdown-item w-full py-2 px-4">
                            {c('Info').t`No folder found`}
                        </li>
                    )}
                    {list.length === 0 && search && (
                        <span className="flex w-full">
                            <Button
                                key="create-new-folder"
                                className="w-full mx-8 text-ellipsis"
                                data-testid="folder-dropdown:create-folder-option"
                                title={createFolderButtonText}
                                onClick={handleCreate}
                            >
                                {createFolderButtonText}
                            </Button>
                        </span>
                    )}
                </ul>
            </div>
            <hr className="m-0 shrink-0" />
            <div className={clsx(['mx-4 mt-4 shrink-0', alwaysCheckboxDisabled && 'color-disabled'])}>
                <Checkbox
                    id={alwaysCheckID}
                    checked={always}
                    disabled={alwaysCheckboxDisabled}
                    onChange={({ target }) => setAlways(target.checked)}
                    data-testid="move-dropdown:always-move"
                    data-prevent-arrow-navigation
                >
                    {c('Label').t`Always move sender's emails`}
                </Checkbox>
            </div>
            <div className="m-4 shrink-0">
                <PrimaryButton
                    className="w-full"
                    loading={loading}
                    disabled={applyDisabled}
                    data-testid="move-dropdown:apply"
                    data-prevent-arrow-navigation
                    type="submit"
                >
                    {c('Action').t`Apply`}
                </PrimaryButton>
            </div>
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

export default MoveDropdown;
