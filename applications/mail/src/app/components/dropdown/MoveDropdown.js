import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
    SearchInput,
    Icon,
    useLabels,
    useModals,
    PrimaryButton,
    classnames,
    Tooltip,
    useLoading,
    useApi,
    useNotifications
} from 'react-components';
import { LABEL_EXCLUSIVE, MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { c } from 'ttag';
import { normalize } from 'proton-shared/lib/helpers/string';
import { labelMessages } from 'proton-shared/lib/api/messages';
import { labelConversations } from 'proton-shared/lib/api/conversations';

import './MoveDropdown.scss';
import { ELEMENT_TYPES } from '../../constants';

const { INBOX, TRASH, SPAM, ARCHIVE } = MAILBOX_LABEL_IDS;

const MoveDropdown = ({ selectedIDs = [], type }) => {
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const api = useApi();
    const { createModal } = useModals();
    const [labels = []] = useLabels();
    const [search, updateSearch] = useState('');
    const normSearch = normalize(search);
    const folders = labels
        .filter(({ Exclusive }) => Exclusive === LABEL_EXCLUSIVE.FOLDER)
        .map((folder) => ({ ...folder, icon: 'folder' }))
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

    const handleMove = async (LabelID) => {
        const action = type === ELEMENT_TYPES.CONVERSATION ? labelConversations : labelMessages;
        await api(action({ LabelID, IDs: selectedIDs }));
        createNotification({ text: c('Success').t`Elements moved` });
    };

    return (
        <div className="p1">
            <div className="flex flex-spacebetween flex-items-center mb1">
                <label htmlFor="filter-folders" className="bold">{c('Label').t`Move to`}</label>
                <Tooltip title={c('Title').t`Create folder`}>
                    <PrimaryButton
                        className="pm-button--small pm-button--for-smallicon"
                        onClick={() => {
                            createModal(); // TODO
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
                    {folders.map(({ ID = '', Name = '', Color = '', icon }, index) => {
                        return (
                            <li key={ID} className={classnames([index < folders.length - 1 && 'border-bottom'])}>
                                <button
                                    type="button"
                                    disabled={loading}
                                    className="w100 flex flex-nowrap flex-items-center pt0-5 pb0-5"
                                    onClick={() => withLoading(handleMove(ID))}
                                >
                                    <Icon name={icon} color={Color} className="flex-item-noshrink mr0-5" />
                                    <span className="ellipsis" title={Name}>
                                        {Name}
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

MoveDropdown.propTypes = {
    selectedIDs: PropTypes.arrayOf(PropTypes.string),
    type: PropTypes.oneOf([ELEMENT_TYPES.CONVERSATION, ELEMENT_TYPES.MESSAGE]).isRequired
};

export default MoveDropdown;
