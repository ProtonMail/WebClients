import React, { useState, useEffect } from 'react';
import { c } from 'ttag';
import {
    LabelModal,
    SearchInput,
    Icon,
    useFolders,
    useModals,
    PrimaryButton,
    Mark,
    Tooltip,
    useLoading,
    generateUID,
} from 'react-components';
import { MAILBOX_LABEL_IDS, LABEL_COLORS, ROOT_FOLDER, LABEL_TYPE } from 'proton-shared/lib/constants';
import { normalize } from 'proton-shared/lib/helpers/string';
import { randomIntFromInterval } from 'proton-shared/lib/helpers/function';
import { buildTreeview } from 'proton-shared/lib/helpers/folder';
import { Folder, FolderWithSubFolders } from 'proton-shared/lib/interfaces/Folder';

import { isMessage as testIsMessage } from '../../helpers/elements';
import { useMoveToFolder } from '../../hooks/useApplyLabels';
import { Breakpoints } from '../../models/utils';
import { useGetElementsFromIDs } from '../../hooks/mailbox/useElementsCache';

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

    const list = treeview
        .reduce<FolderItem[]>((acc, folder) => folderReducer(acc, folder), [])
        .concat([
            { ID: INBOX, Name: c('Mailbox').t`Inbox`, icon: 'inbox' },
            { ID: ARCHIVE, Name: c('Mailbox').t`Archive`, icon: 'archive' },
            { ID: SPAM, Name: c('Mailbox').t`Spam`, icon: 'spam' },
            { ID: TRASH, Name: c('Mailbox').t`Trash`, icon: 'trash' },
        ] as FolderItem[])
        .filter(({ Name = '' }: { Name: string }) => {
            if (!search) {
                return true;
            }
            const normName = normalize(Name, true);
            return normName.includes(normSearch);
        });

    const handleMove = async (folder?: Folder) => {
        const elements = getElementsFromIDs(selectedIDs);
        const isMessage = testIsMessage(elements[0]);
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
    const autoFocusSearch = !breakpoints.isNarrow;

    return (
        <>
            <div className="flex flex-spacebetween flex-items-center m1 mb0">
                <span className="bold" tabIndex={-2}>
                    {c('Label').t`Move to`}
                </span>
                <Tooltip title={c('Title').t`Create folder`}>
                    <PrimaryButton className="pm-button--small pm-button--for-smallicon" onClick={handleCreate}>
                        <Icon name="folder" className="flex-item-noshrink mr0-25" />+
                    </PrimaryButton>
                </Tooltip>
            </div>
            <div className="m1 mb0">
                <SearchInput
                    value={search}
                    onChange={updateSearch}
                    id={searchInputID}
                    placeholder={c('Placeholder').t`Filter folders`}
                    autoFocus={autoFocusSearch}
                />
            </div>
            <div className="scroll-if-needed customScrollBar-container scroll-smooth-touch mt1 moveDropdown-list-container">
                <ul className="unstyled mt0 mb0">
                    {list.map((folder: FolderItem) => {
                        return (
                            <li key={folder.ID} className="dropDown-item">
                                <button
                                    data-level={folder.level}
                                    type="button"
                                    disabled={loading}
                                    className="dropDown-item-button w100 flex flex-nowrap flex-items-center pl1 pr1 pt0-5 pb0-5"
                                    onClick={() => withLoading(handleMove(folder))}
                                >
                                    <Icon name={folder.icon || 'folder'} className="flex-item-noshrink mr0-5" />
                                    <span className="ellipsis" title={folder.Name}>
                                        <Mark value={search}>{folder.Name}</Mark>
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                    {list.length === 0 && (
                        <li key="empty" className="dropDown-item w100 pt0-5 pb0-5 pl1 pr1">
                            {c('Info').t`No folder found`}
                        </li>
                    )}
                </ul>
            </div>
        </>
    );
};

export default MoveDropdown;
