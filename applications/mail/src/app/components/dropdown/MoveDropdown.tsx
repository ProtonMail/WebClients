import React, { useState } from 'react';
import {
    LabelModal,
    SearchInput as UntypedSearchInput,
    Icon,
    useLabels,
    useModals,
    PrimaryButton,
    classnames,
    Tooltip,
    useLoading,
    useApi,
    useNotifications,
    useEventManager
} from 'react-components';
import { LABEL_EXCLUSIVE, MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { c } from 'ttag';
import { normalize } from 'proton-shared/lib/helpers/string';
import { labelMessages } from 'proton-shared/lib/api/messages';
import { labelConversations } from 'proton-shared/lib/api/conversations';

import { ELEMENT_TYPES } from '../../constants';
import { Label } from '../../models/label';

import './MoveDropdown.scss';

const SearchInput = UntypedSearchInput as any;

const { INBOX, TRASH, SPAM, ARCHIVE } = MAILBOX_LABEL_IDS;

interface Props {
    selectedIDs: string[];
    type: string;
    onClose: () => void;
}

const MoveDropdown = ({ selectedIDs = [], type, onClose }: Props) => {
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const api = useApi();
    const { call } = useEventManager();
    const { createModal } = useModals();
    const [labels = []]: [Label[]] = useLabels();
    const [search, updateSearch] = useState('');
    const normSearch = normalize(search);
    const folders = labels
        .filter(({ Exclusive }) => Exclusive === LABEL_EXCLUSIVE.FOLDER)
        .concat(
            [
                { ID: INBOX, Name: c('Mailbox').t`Inbox`, icon: 'inbox' },
                { ID: ARCHIVE, Name: c('Mailbox').t`Archive`, icon: 'archive' },
                { ID: SPAM, Name: c('Mailbox').t`Spam`, icon: 'spam' },
                { ID: TRASH, Name: c('Mailbox').t`Trash`, icon: 'trash' }
            ].filter(Boolean)
        )
        .filter(({ Name = '' }) => {
            if (!search) {
                return true;
            }
            const normName = normalize(Name);
            return normName.includes(normSearch);
        });

    const handleMove = async (folder: Label) => {
        const action = type === ELEMENT_TYPES.CONVERSATION ? labelConversations : labelMessages;
        await api(action({ LabelID: folder.ID, IDs: selectedIDs }));
        await call();
        onClose();
        createNotification({ text: c('Success').t`Elements moved to ${folder.Name}` });
    };

    return (
        <div className="p1">
            <div className="flex flex-spacebetween flex-items-center mb1">
                <label htmlFor="filter-folders" className="bold">{c('Label').t`Move to`}</label>
                <Tooltip title={c('Title').t`Create folder`}>
                    <PrimaryButton
                        className="pm-button--small pm-button--for-smallicon"
                        onClick={() => {
                            createModal(<LabelModal type="folder" label={null} />);
                        }}
                    >
                        <Icon name="folder" fill="light" className="flex-item-noshrink mr0-25" />+
                    </PrimaryButton>
                </Tooltip>
            </div>
            <div className="mb1">
                <SearchInput
                    autoFocus={true}
                    value={search}
                    onChange={updateSearch}
                    id="filter-folders"
                    placeholder={c('Placeholder').t`Filter folders`}
                />
            </div>
            <div className="scroll-if-needed scroll-smooth-touch moveDropdown-list-container">
                <ul className="unstyled mt0 mb0">
                    {folders.map((folder, index) => {
                        return (
                            <li key={folder.ID} className={classnames([index < folders.length - 1 && 'border-bottom'])}>
                                <button
                                    type="button"
                                    disabled={loading}
                                    className="w100 flex flex-nowrap flex-items-center pt0-5 pb0-5"
                                    onClick={() => withLoading(handleMove(folder))}
                                >
                                    <Icon name="folder" color={folder.Color} className="flex-item-noshrink mr0-5" />
                                    <span className="ellipsis" title={folder.Name}>
                                        {folder.Name}
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
};

export default MoveDropdown;
