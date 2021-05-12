import React, { useState, useEffect } from 'react';
import { c } from 'ttag';
import {
    LabelModal,
    SearchInput,
    useFolders,
    useModals,
    Mark,
    Tooltip,
    useLoading,
    generateUID,
    FolderIcon,
    Icon,
    Button,
} from 'react-components';
import { MAILBOX_LABEL_IDS, LABEL_COLORS, ROOT_FOLDER, LABEL_TYPE } from 'proton-shared/lib/constants';
import { normalize } from 'proton-shared/lib/helpers/string';
import { randomIntFromInterval } from 'proton-shared/lib/helpers/function';
import { buildTreeview } from 'proton-shared/lib/helpers/folder';
import { Folder, FolderWithSubFolders } from 'proton-shared/lib/interfaces/Folder';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import { Message } from 'proton-shared/lib/interfaces/mail/Message';

import { isMessage as testIsMessage } from '../../helpers/elements';
import { useMoveToFolder } from '../../hooks/useApplyLabels';
import { Breakpoints } from '../../models/utils';
import { useGetElementsFromIDs } from '../../hooks/mailbox/useElementsCache';
import { getMessagesAuthorizedToMove } from '../../helpers/message/messages';

import './MoveDropdown.scss';

type FolderItem = Folder & { icon: string; level: number };

const { INBOX, TRASH, SPAM, ARCHIVE } = MAILBOX_LABEL_IDS;

const folderReducer = (acc: FolderItem[], folder: FolderWithSubFolders, level = 0): FolderItem[] => {
    acc.push({
        ...folder,
        Name: folder.Name,
        icon: folder.subfolders?.length ? 'parent-folder' : 'folder',
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
    conversationMode: boolean;
    onClose: () => void;
    onLock: (lock: boolean) => void;
    onBack: () => void;
    breakpoints: Breakpoints;
}

const MoveDropdown = ({ selectedIDs, labelID, conversationMode, onClose, onLock, onBack, breakpoints }: Props) => {
    const [uid] = useState(generateUID('move-dropdown'));

    const [loading, withLoading] = useLoading();
    const { createModal } = useModals();
    const [folders = []] = useFolders();
    const [search, updateSearch] = useState('');
    const [containFocus, setContainFocus] = useState(true);
    const normSearch = normalize(search, true);
    const getElementsFromIDs = useGetElementsFromIDs();
    const moveToFolder = useMoveToFolder();

    useEffect(() => onLock(!containFocus), [containFocus]);

    const treeview = buildTreeview(folders);
    const elements = getElementsFromIDs(selectedIDs);
    const isMessage = testIsMessage(elements[0]);
    const canMoveToInbox = isMessage ? !!getMessagesAuthorizedToMove(elements as Message[], INBOX).length : true;
    const canMoveToSpam = isMessage ? !!getMessagesAuthorizedToMove(elements as Message[], SPAM).length : true;

    const list = treeview
        .reduce<FolderItem[]>((acc, folder) => folderReducer(acc, folder), [])
        .concat([
            canMoveToInbox && {
                ID: INBOX,
                Name: c('Mailbox').t`Inbox`,
                icon: 'inbox',
            },
            { ID: ARCHIVE, Name: c('Mailbox').t`Archive`, icon: 'archive' },
            canMoveToSpam && {
                ID: SPAM,
                Name: c('Mailbox').t`Spam`,
                icon: 'spam',
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

    const handleMove = async (folder?: Folder) => {
        await moveToFolder(elements, folder?.ID || '', folder?.Name || '', labelID);
        onClose();

        if (!isMessage || !conversationMode) {
            onBack();
        }
    };

    const handleCreate = () => {
        setContainFocus(false);
        const newLabel: Pick<Folder, 'Name' | 'Color' | 'ParentID' | 'Type'> = {
            Name: search,
            Color: LABEL_COLORS[randomIntFromInterval(0, LABEL_COLORS.length - 1)],
            ParentID: ROOT_FOLDER,
            Type: LABEL_TYPE.MESSAGE_FOLDER,
        };
        createModal(<LabelModal label={newLabel} onClose={() => setContainFocus(true)} />);
    };

    // The dropdown is several times in the view, native html ids has to be different each time
    const searchInputID = `${uid}-search`;
    const folderButtonID = (ID: string) => `${uid}-${ID}`;
    const autoFocusSearch = !breakpoints.isNarrow;

    return (
        <>
            <div className="flex flex-justify-space-between flex-align-items-center m1 mb0">
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
                    >
                        <Icon name="folder" /> +
                    </Button>
                </Tooltip>
            </div>
            <div className="m1 mb0">
                <SearchInput
                    value={search}
                    onChange={updateSearch}
                    id={searchInputID}
                    placeholder={c('Placeholder').t`Filter folders`}
                    autoFocus={autoFocusSearch}
                    data-testid="folder-dropdown:search-folder"
                />
            </div>
            <div
                className="scroll-if-needed scroll-smooth-touch mt1 move-dropdown-list-container"
                data-testid="move-dropdown-list"
            >
                <ul className="unstyled mt0 mb0">
                    {list.map((folder: FolderItem) => {
                        return (
                            <li key={folder.ID} className="dropdown-item">
                                <button
                                    id={folderButtonID(folder.ID)}
                                    data-level={folder.level}
                                    type="button"
                                    disabled={loading}
                                    className="dropdown-item-button w100 flex flex-nowrap flex-align-items-center pl1 pr1 pt0-5 pb0-5"
                                    onClick={() => withLoading(handleMove(folder))}
                                    data-testid={`folder-dropdown:folder-${folder.Name}`}
                                >
                                    <FolderIcon
                                        folder={folder}
                                        name={folder.icon}
                                        className="flex-item-noshrink mr0-5"
                                    />
                                    <span className="text-ellipsis" title={folder.Name}>
                                        <Mark value={search}>{folder.Name}</Mark>
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                    {list.length === 0 && (
                        <li key="empty" className="dropdown-item w100 pt0-5 pb0-5 pl1 pr1">
                            {c('Info').t`No folder found`}
                        </li>
                    )}
                </ul>
            </div>
        </>
    );
};

export default MoveDropdown;
