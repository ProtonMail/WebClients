import { useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import {
    Checkbox,
    FolderIcon,
    Icon,
    InputFieldTwo,
    type ModalProps,
    Prompt,
    useDebounceInput,
    useNotifications,
} from '@proton/components';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { normalize } from '@proton/shared/lib/helpers/string';
import { type NewsletterSubscription } from '@proton/shared/lib/interfaces/NewsletterSubscription';

import type { FolderItem } from 'proton-mail/hooks/useMailTreeView/interface';
import { useMailFolderTreeView } from 'proton-mail/hooks/useMailTreeView/useMailFolderTreeView';
import { useMailDispatch, useMailSelector } from 'proton-mail/store/hooks';
import { filterSubscriptionList } from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsActions';
import { getFilteredSubscriptionIndex } from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsSelector';

import { getReceivedMessagesCount } from '../../helper';

import './ModalMoveToFolder.scss';

interface Props extends ModalProps {
    subscription: NewsletterSubscription;
}

export const ModalMoveToFolder = ({ subscription, ...props }: Props) => {
    const { list } = useMailFolderTreeView();
    const dispatch = useMailDispatch();
    const subscriptionIndex = useMailSelector(getFilteredSubscriptionIndex(subscription.ID));

    const [search, setSearch] = useState('');
    const words = useDebounceInput(search, 200);

    const { createNotification } = useNotifications();

    const [applyFuture, setApplyFuture] = useState(false);
    const [selectedFolder, setSelectedFolder] = useState<FolderItem | null>(null);

    const treeView = list
        .concat([
            {
                ID: MAILBOX_LABEL_IDS.INBOX,
                Name: c('Mailbox').t`Inbox`,
                icon: 'inbox',
            },
            {
                ID: MAILBOX_LABEL_IDS.ARCHIVE,
                Name: c('Mailbox').t`Archive`,
                icon: 'archive-box',
            },
            {
                ID: MAILBOX_LABEL_IDS.SPAM,
                Name: c('Mailbox').t`Spam`,
                icon: 'fire',
            },
            {
                ID: MAILBOX_LABEL_IDS.TRASH,
                Name: c('Mailbox').t`Trash`,
                icon: 'trash',
            },
        ] as FolderItem[])
        .filter((folder) => {
            if (!words) {
                return true;
            }

            return normalize(folder.Name, true).includes(normalize(words, true));
        });

    const handleChange = () => {
        setApplyFuture((val) => !val);
    };

    const handleSelectFolder = (folder: FolderItem) => {
        setSelectedFolder(folder);
    };

    const handleSearch = (changeEvent: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(changeEvent.target.value);
    };

    const handleMoveToFolder = () => {
        if (!selectedFolder) {
            return;
        }

        void dispatch(
            filterSubscriptionList({
                subscription,
                subscriptionIndex,
                data: {
                    ApplyTo: applyFuture ? 'All' : 'Existing',
                    DestinationFolder: selectedFolder.ID,
                    MarkAsRead: false,
                },
            })
        );

        const count = getReceivedMessagesCount(subscription);
        createNotification({
            // TODO add undo actions once the API returns a undo token
            text: c('Label').ngettext(
                msgid`Moved ${count} message to ${selectedFolder.Name}.`,
                `Moved ${count} messages to ${selectedFolder.Name}.`,
                count
            ),
        });

        props?.onClose?.();
    };

    return (
        <Prompt
            buttons={[
                <div>
                    <Checkbox id="applyFuture" checked={applyFuture} className="mb-2" onChange={handleChange}>
                        {c('Label').t`Apply to future messages`}
                    </Checkbox>
                </div>,
                <Button disabled={selectedFolder === null} color="norm" onClick={handleMoveToFolder}>{c('Action')
                    .t`Move`}</Button>,
                <Button onClick={() => props?.onClose?.()}>{c('Action').t`Cancel`}</Button>,
            ]}
            ModalContentProps={{
                className: 'my-0',
            }}
            {...props}
        >
            <div className="modal-move-folder">
                <InputFieldTwo
                    id="search-input"
                    unstyled
                    labelContainerClassName="color-weak text-sm"
                    inputContainerClassName="border-bottom border-primary"
                    value={search}
                    onChange={handleSearch}
                    label={c('Label').t`Move messages to`}
                    data-prevent-arrow-navigation
                    assistContainerClassName="h-2"
                    prefix={<Icon name="magnifier" />}
                    placeholder={c('Placeholder').t`Filter folders`}
                />
                <div className="modal-move-folder-list">
                    <ul className="unstyled my-0 overflow-auto flex-auto">
                        {treeView.map((folder) => (
                            <li key={folder.ID}>
                                <Button
                                    fullWidth
                                    shape={selectedFolder?.ID === folder.ID ? 'solid' : 'ghost'}
                                    className="text-left"
                                    color={selectedFolder?.ID === folder.ID ? 'weak' : undefined}
                                    onClick={() => handleSelectFolder(folder)}
                                >
                                    <div data-level={folder.level} className="flex">
                                        <FolderIcon folder={folder} name={folder.icon} className="shrink-0 mr-2" />
                                        <span className="text-ellipsis flex-1" title={folder.Name}>
                                            {folder.Name}
                                        </span>
                                        {selectedFolder?.ID === folder.ID && (
                                            <Icon name="checkmark" className="text-success shrink-0" />
                                        )}
                                    </div>
                                </Button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </Prompt>
    );
};
