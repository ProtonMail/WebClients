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
import { MAILBOX_LABEL_IDS, LABEL_COLORS } from 'proton-shared/lib/constants';
import { c } from 'ttag';
import { normalize } from 'proton-shared/lib/helpers/string';
import { labelMessages } from 'proton-shared/lib/api/messages';
import { labelConversations } from 'proton-shared/lib/api/conversations';
import { randomIntFromInterval } from 'proton-shared/lib/helpers/function';

import { Label } from '../../models/label';
import { getFolders } from '../../helpers/labels';
import { isMessage } from '../../helpers/elements';
import { Element } from '../../models/element';

import './MoveDropdown.scss';

const SearchInput = UntypedSearchInput as any;

const { INBOX, TRASH, SPAM, ARCHIVE } = MAILBOX_LABEL_IDS;

type LabelWithIcon = Label & { icon?: string };

interface Props {
    elements: Element[];
    onClose: () => void;
    onLock: (lock: boolean) => void;
}

const MoveDropdown = ({ elements, onClose, onLock }: Props) => {
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const api = useApi();
    const { call } = useEventManager();
    const { createModal } = useModals();
    const [labels = []] = useLabels() as [Label[], boolean, Error];
    const [search, updateSearch] = useState('');
    const normSearch = normalize(search);

    if (!elements || !elements.length || !labels || !labels.length) {
        return null;
    }

    const typeIsMessage = isMessage(elements[0]);

    const folders: LabelWithIcon[] = getFolders(labels)
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

    const handleMove = async (folder?: Label) => {
        const action = typeIsMessage ? labelMessages : labelConversations;
        const selectedIDs = elements.map((element) => element.ID || '');

        await api(action({ LabelID: folder?.ID, IDs: selectedIDs }));
        await call();
        onClose();
        createNotification({ text: c('Success').t`Elements moved to ${folder?.Name}` });
    };

    const handleCreate = () => {
        onLock(true);
        const newLabel = {
            Name: search,
            Color: LABEL_COLORS[randomIntFromInterval(0, LABEL_COLORS.length - 1)],
            Exclusive: true
        };
        createModal(<LabelModal type="folder" label={newLabel} onClose={() => onLock(false)} />);
    };

    return (
        <div className="p1">
            <div className="flex flex-spacebetween flex-items-center mb1">
                <label htmlFor="filter-folders" className="bold">{c('Label').t`Move to`}</label>
                <Tooltip title={c('Title').t`Create folder`}>
                    <PrimaryButton className="pm-button--small pm-button--for-smallicon" onClick={handleCreate}>
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
                                    <Icon
                                        name={folder.icon || 'folder'}
                                        color={folder.Color}
                                        className="flex-item-noshrink mr0-5"
                                    />
                                    <span className="ellipsis" title={folder.Name}>
                                        {folder.Name}
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                    {folders.length === 0 && (
                        <li
                            key="empty"
                            className="w100 flex flex-nowrap flex-spacebetween flex-items-center pt0-5 pb0-5"
                        >
                            {c('Info').t`No folder found`}
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default MoveDropdown;
