import { useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    Checkbox,
    FolderIcon,
    Icon,
    IconName,
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
import EditLabelModal from '@proton/components/containers/labels/modals/EditLabelModal';
import { useLoading } from '@proton/hooks';
import { ACCENT_COLORS } from '@proton/shared/lib/colors';
import { LABEL_TYPE, MAILBOX_LABEL_IDS, MAIL_UPSELL_PATHS } from '@proton/shared/lib/constants';
import { buildTreeview, hasReachedFolderLimit } from '@proton/shared/lib/helpers/folder';
import { normalize } from '@proton/shared/lib/helpers/string';
import { Label } from '@proton/shared/lib/interfaces';
import { Folder, FolderWithSubFolders } from '@proton/shared/lib/interfaces/Folder';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';
import randomIntFromInterval from '@proton/utils/randomIntFromInterval';

import { isMessage as testIsMessage } from '../../helpers/elements';
import { getMessagesAuthorizedToMove } from '../../helpers/message/messages';
import { useCreateFilters } from '../../hooks/actions/useCreateFilters';
import { useMoveToFolder } from '../../hooks/actions/useMoveToFolder';
import { useGetElementsFromIDs } from '../../hooks/mailbox/useElements';
import { Breakpoints } from '../../models/utils';

import './MoveDropdown.scss';

export const moveDropdownContentProps = { className: 'flex flex-column flex-nowrap flex-align-items-stretch' };

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
}

const MoveDropdown = ({ selectedIDs, labelID, onClose, onLock, breakpoints }: Props) => {
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
    const { moveToFolder, moveScheduledModal, moveAllModal, moveToSpamModal } = useMoveToFolder(setContainFocus);
    const { getSendersToFilter } = useCreateFilters();

    const [editLabelProps, setEditLabelModalOpen, renderLabelModal] = useModalState();
    const [upsellModalProps, handleUpsellModalDisplay, renderUpsellModal] = useModalState();

    useEffect(() => onLock(!containFocus), [containFocus]);

    const treeview = buildTreeview(folders);
    const elements = getElementsFromIDs(selectedIDs);
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
        return !getSendersToFilter(elements).length || !selectedFolder;
    }, [getSendersToFilter, elements]);

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

        await moveToFolder(elements, selectedFolderID, selectedFolderName, labelID, canApplyAlways ? always : false);
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
    const autoFocusSearch = !breakpoints.isNarrow;
    const applyDisabled = selectedFolder?.ID === undefined;

    const newFolder: Pick<Label, 'Name' | 'Color' | 'Type'> = {
        Name: search,
        Color: ACCENT_COLORS[randomIntFromInterval(0, ACCENT_COLORS.length - 1)],
        Type: LABEL_TYPE.MESSAGE_FOLDER,
    };

    return (
        <form
            className="flex flex-column flex-nowrap flex-justify-start flex-align-items-stretch flex-item-fluid-auto"
            onSubmit={handleSubmit}
        >
            <div className="flex flex-item-noshrink flex-justify-space-between flex-align-items-center m-4 mb-0">
                <span className="text-bold" tabIndex={-2}>
                    {c('Label').t`Move to`}
                </span>
                <Tooltip title={c('Title').t`Create folder`}>
                    <Button
                        icon
                        color="norm"
                        size="small"
                        onClick={handleCreate}
                        className="flex flex-align-items-center"
                        data-testid="folder-dropdown:add-folder"
                        data-prevent-arrow-navigation
                    >
                        <Icon name="folder" /> +
                    </Button>
                </Tooltip>
            </div>
            <div className="flex-item-noshrink m-4 mb-0">
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
            <div
                className="move-dropdown-list overflow-auto mt-4 flex-item-fluid-auto"
                data-testid="move-dropdown-list"
            >
                <ul className="unstyled my-0">
                    {list.map((folder: FolderItem) => {
                        return (
                            <li
                                key={folder.ID}
                                className="dropdown-item dropdown-item-button relative cursor-pointer w100 flex flex-nowrap flex-align-items-center py-2 px-4"
                            >
                                <Radio
                                    className="flex-item-noshrink mr-2"
                                    id={folderButtonID(folder.ID)}
                                    name={uid}
                                    checked={selectedFolder?.ID === folder.ID}
                                    onChange={() => setSelectedFolder(folder)}
                                    data-testid={`label-dropdown:folder-radio-${folder.Name}`}
                                />
                                <label
                                    htmlFor={folderButtonID(folder.ID)}
                                    data-level={folder.level}
                                    className="flex flex-nowrap flex-align-items-center flex-item-fluid"
                                    data-testid={`folder-dropdown:folder-${folder.Name}`}
                                    onClick={() => handleApplyDirectly(folder.ID, folder.Name)}
                                >
                                    <FolderIcon
                                        folder={folder}
                                        name={folder.icon}
                                        className="flex-item-noshrink mr-2"
                                    />
                                    <span className="text-ellipsis" title={folder.Name}>
                                        <Mark value={search}>{folder.Name}</Mark>
                                    </span>
                                </label>
                            </li>
                        );
                    })}
                    {list.length === 0 && !search && (
                        <li key="empty" className="dropdown-item w100 py-2 px-4">
                            {c('Info').t`No folder found`}
                        </li>
                    )}
                    {list.length === 0 && search && (
                        <span className="flex w100">
                            <Button
                                key="create-new-folder"
                                className="w100 mx-8 text-ellipsis"
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
            <hr className="m-0 flex-item-noshrink" />
            <div className={clsx(['mx-4 mt-4 flex-item-noshrink', alwaysCheckboxDisabled && 'color-disabled'])}>
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
            <div className="m-4 flex-item-noshrink">
                <PrimaryButton
                    className="w100"
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
            {moveAllModal}
            {moveToSpamModal}
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
