import React, { useState } from 'react';
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
    generateUID
} from 'react-components';
import { MAILBOX_LABEL_IDS, LABEL_COLORS, ROOT_FOLDER, LABEL_TYPE } from 'proton-shared/lib/constants';
import { c } from 'ttag';
import { normalize } from 'proton-shared/lib/helpers/string';
import { randomIntFromInterval } from 'proton-shared/lib/helpers/function';
import { buildTreeview } from 'proton-shared/lib/helpers/folder';
import { Folder, FolderWithSubFolders } from 'proton-shared/lib/interfaces/Folder';

import { isMessage as testIsMessage } from '../../helpers/elements';
import { Element } from '../../models/element';

type FolderItem = Folder & { icon: string; level: number };

import './MoveDropdown.scss';
import { useMoveToFolder } from '../../hooks/useApplyLabels';

const { INBOX, TRASH, SPAM, ARCHIVE } = MAILBOX_LABEL_IDS;

const folderReducer = (acc: FolderItem[], folder: FolderWithSubFolders, level = 0): FolderItem[] => {
    acc.push({
        ...folder,
        Name: folder.Name,
        icon: folder.subfolders?.length ? 'parent-folder' : 'folder',
        level
    });

    if (Array.isArray(folder.subfolders)) {
        folder.subfolders.forEach((folder: FolderWithSubFolders) => folderReducer(acc, folder, level + 1));
    }

    return acc;
};

interface Props {
    elements: Element[];
    labelID: string;
    onClose: () => void;
    onLock: (lock: boolean) => void;
}

const MoveDropdown = ({ elements, labelID, onClose, onLock }: Props) => {
    const [uid] = useState(generateUID('move-dropdown'));

    const [loading, withLoading] = useLoading();
    const { createModal } = useModals();
    const [folders = [], loadingFolders] = useFolders();
    const [search, updateSearch] = useState('');
    const normSearch = normalize(search);
    const moveToFolder = useMoveToFolder();

    if (!elements || !elements.length || loadingFolders || !Array.isArray(folders)) {
        return null;
    }

    const treeview = buildTreeview(folders);

    const list = treeview
        .reduce((acc: FolderItem[], folder: Folder) => folderReducer(acc, folder), [])
        .concat([
            { ID: INBOX, Name: c('Mailbox').t`Inbox`, icon: 'inbox' },
            { ID: ARCHIVE, Name: c('Mailbox').t`Archive`, icon: 'archive' },
            { ID: SPAM, Name: c('Mailbox').t`Spam`, icon: 'spam' },
            { ID: TRASH, Name: c('Mailbox').t`Trash`, icon: 'trash' }
        ])
        .filter(({ Name = '' }: { Name: string }) => {
            if (!search) {
                return true;
            }
            const normName = normalize(Name);
            return normName.includes(normSearch);
        });

    const handleMove = async (folder?: Folder) => {
        const isMessage = testIsMessage(elements[0]);
        const elementIDs = elements.map((element) => element.ID || '');
        await moveToFolder(isMessage, elementIDs, folder?.ID || '', folder?.Name || '', labelID);
        onClose();
    };

    const handleCreate = () => {
        onLock(true);
        const newLabel: Partial<Folder> = {
            Name: search,
            Color: LABEL_COLORS[randomIntFromInterval(0, LABEL_COLORS.length - 1)],
            ParentID: String(ROOT_FOLDER),
            Type: LABEL_TYPE.MESSAGE_FOLDER
        };
        createModal(<LabelModal label={newLabel} onClose={() => onLock(false)} />);
    };

    // The dropdown is several times in the view, native html ids has to be different each time
    const searchInputID = `${uid}-search`;

    return (
        <>
            <div className="flex flex-spacebetween flex-items-center m1 mb0">
                <label htmlFor={searchInputID} className="bold">{c('Label').t`Move to`}</label>
                <Tooltip title={c('Title').t`Create folder`}>
                    <PrimaryButton className="pm-button--small pm-button--for-smallicon" onClick={handleCreate}>
                        <Icon name="folder" className="flex-item-noshrink mr0-25" />+
                    </PrimaryButton>
                </Tooltip>
            </div>
            <div className="m1 mb0">
                <SearchInput
                    autoFocus={true}
                    value={search}
                    onChange={updateSearch}
                    id={searchInputID}
                    placeholder={c('Placeholder').t`Filter folders`}
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
                        <li
                            key="empty"
                            className="w100 flex flex-nowrap flex-items-center pt0-5 pb0-5 pl1 pr1 border-top"
                        >
                            <Icon name="attention" className="mr0-5" />
                            {c('Info').t`No folder found`}
                        </li>
                    )}
                </ul>
            </div>
        </>
    );
};

export default MoveDropdown;
