import { useState } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { useApi } from '@proton/app-context/useApi';
import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import Checkbox from '@proton/components/components/input/Checkbox';
import useDebounceInput from '@proton/components/components/input/useDebounceInput';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Prompt from '@proton/components/components/prompt/Prompt';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import FolderIcon from '@proton/components/containers/labels/FolderIcon';
import useEventManager from '@proton/components/hooks/useEventManager';
import useLoading from '@proton/hooks/useLoading';
import { IcArchiveBox } from '@proton/icons/icons/IcArchiveBox';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { IcFire } from '@proton/icons/icons/IcFire';
import { IcInbox } from '@proton/icons/icons/IcInbox';
import { IcMagnifier } from '@proton/icons/icons/IcMagnifier';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import { IcTrash } from '@proton/icons/icons/IcTrash';
import { useFolders } from '@proton/mail/store/labels/hooks';
import { create } from '@proton/shared/lib/api/labels';
import { getRandomAccentColor } from '@proton/shared/lib/colors';
import { LABEL_TYPE, MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { hasReachedFolderLimit } from '@proton/shared/lib/helpers/folder';
import { normalize } from '@proton/shared/lib/helpers/string';
import type { NewsletterSubscription } from '@proton/shared/lib/interfaces/NewsletterSubscription';

import type { FolderItem } from '../../../../../hooks/useMailTreeView/interface';
import { useMailFolderTreeView } from '../../../../../hooks/useMailTreeView/useMailFolderTreeView';
import { useMailDispatch, useMailSelector } from '../../../../../store/hooks';
import { MAX_FOLDER_NAME_LENGTH } from '../../../../../store/newsletterSubscriptions/constants';
import { filterSubscriptionList } from '../../../../../store/newsletterSubscriptions/newsletterSubscriptionsActions';
import { getFilteredSubscriptionIndex } from '../../../../../store/newsletterSubscriptions/newsletterSubscriptionsSelector';
import { NewsletterSubscriptionAction } from '../../interface';
import { useNewsletterSubscriptionTelemetry } from '../../useNewsletterSubscriptionTelemetry';

import './ModalMoveToFolder.scss';

interface Props extends ModalProps {
    subscription: NewsletterSubscription;
    handleUpsellModalDisplay: (display: boolean) => void;
}

const BoldFolderName = ({ name }: { name: string }) => {
    return <strong>{name}</strong>;
};

export const ModalMoveToFolder = ({ subscription, handleUpsellModalDisplay, ...props }: Props) => {
    const api = useApi();
    const { call } = useEventManager();

    const { sendNewsletterAction } = useNewsletterSubscriptionTelemetry();

    const { list } = useMailFolderTreeView();
    const dispatch = useMailDispatch();
    const subscriptionIndex = useMailSelector(getFilteredSubscriptionIndex(subscription.ID));

    const [user] = useUser();
    const [folders = []] = useFolders();

    const [loading, withLoading] = useLoading();

    const [search, setSearch] = useState('');
    const words = useDebounceInput(search, 200);

    const { createNotification } = useNotifications();

    const [applyToFuture, setApplyToFuture] = useState(false);
    const [selectedFolder, setSelectedFolder] = useState<FolderItem | null>(null);

    const newFolderName = subscription.Name.slice(0, MAX_FOLDER_NAME_LENGTH);
    const showCreateFolderButton = !folders?.find((folder) => folder.Name === newFolderName);

    const treeView = list
        .concat([
            {
                ID: MAILBOX_LABEL_IDS.INBOX,
                Name: c('Mailbox').t`Inbox`,
                icon: IcInbox,
            },
            {
                ID: MAILBOX_LABEL_IDS.ARCHIVE,
                Name: c('Mailbox').t`Archive`,
                icon: IcArchiveBox,
            },
            {
                ID: MAILBOX_LABEL_IDS.SPAM,
                Name: c('Mailbox').t`Spam`,
                icon: IcFire,
            },
            {
                ID: MAILBOX_LABEL_IDS.TRASH,
                Name: c('Mailbox').t`Trash`,
                icon: IcTrash,
            },
        ] as FolderItem[])
        .filter((folder) => {
            if (!words) {
                return true;
            }

            return normalize(folder.Name, true).includes(normalize(words, true));
        });

    const handleChange = () => {
        setApplyToFuture((val) => !val);
    };

    const handleSelectFolder = (folder: FolderItem) => {
        setSelectedFolder(folder);
    };

    const handleSearch = (changeEvent: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(changeEvent.target.value);
    };

    const handleMoveToFolder = (labelId: string, labelName: string, isNewFolder = false) => {
        if (!labelId) {
            return;
        }

        void dispatch(
            filterSubscriptionList({
                subscription,
                subscriptionIndex,
                data: {
                    ApplyTo: applyToFuture ? 'All' : 'Existing',
                    DestinationFolder: labelId,
                    MarkAsRead: false,
                },
            })
        );

        createNotification({
            text: c('Label').t`Moved to ${labelName}`,
        });

        sendNewsletterAction({
            newsletterAction: isNewFolder
                ? NewsletterSubscriptionAction.createAndMoveToFolder
                : NewsletterSubscriptionAction.moveToFolder,
            applyToFuture: applyToFuture,
            moveToArchive: labelId === MAILBOX_LABEL_IDS.ARCHIVE,
            moveToTrash: labelId === MAILBOX_LABEL_IDS.TRASH,
            labelId,
        });

        props?.onClose?.();
    };

    const handleCreateFolder = async () => {
        // Uspell is displayed if the user reach the folders limit
        if (hasReachedFolderLimit(user, folders)) {
            handleUpsellModalDisplay(true);
            props?.onClose?.();
            return;
        }

        const label = await api(
            create({
                Name: newFolderName,
                Color: getRandomAccentColor(),
                Type: LABEL_TYPE.MESSAGE_FOLDER,
            })
        );

        if (label.Label.ID) {
            void handleMoveToFolder(label.Label.ID, label.Label.Name, true);
            void call();
        } else {
            createNotification({
                text: c('Label').t`Failed to create folder ${newFolderName}`,
                type: 'error',
            });
        }
    };

    const boldFolderName = <BoldFolderName name={newFolderName} key="bold-folder-name" />;

    return (
        <Prompt
            buttons={[
                <div className="w-full">
                    {showCreateFolderButton && (
                        <>
                            <hr className="mb-0 bg-weak divider-size" />
                            <div className="my-1">
                                <Button
                                    fullWidth
                                    onClick={() => withLoading(handleCreateFolder)}
                                    disabled={loading}
                                    shape="ghost"
                                    className="text-left flex items-start"
                                    data-testid="create-folder-button"
                                >
                                    <IcPlus className="mr-2 mt-0.5" />
                                    <span className="flex-1">{c('Action').jt`Create folder ${boldFolderName}`}</span>
                                </Button>
                            </div>
                        </>
                    )}
                    <hr className="bg-weak divider-size" />
                    <Checkbox id="applyFuture" checked={applyToFuture} className="mb-2" onChange={handleChange}>
                        {c('Label').t`Apply to future messages`}
                    </Checkbox>
                </div>,
                <Button
                    disabled={selectedFolder === null}
                    color="norm"
                    onClick={() => {
                        if (selectedFolder) {
                            handleMoveToFolder(selectedFolder.ID, selectedFolder.Name);
                        }
                    }}
                    data-testid="move-button"
                >{c('Action').t`Move`}</Button>,
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
                    prefix={<IcMagnifier />}
                    placeholder={c('Placeholder').t`Filter folders`}
                />
                <div className="modal-move-folder-list">
                    <ul className="unstyled my-0 overflow-auto flex-auto">
                        {treeView.map((folder) => (
                            <li key={folder.ID}>
                                <Button
                                    fullWidth
                                    shape={selectedFolder?.ID === folder.ID ? 'solid' : 'ghost'}
                                    color={selectedFolder?.ID === folder.ID ? 'weak' : undefined}
                                    className="text-left"
                                    onClick={() => handleSelectFolder(folder)}
                                    aria-pressed={selectedFolder?.ID === folder.ID}
                                    data-testid={`button-folder-${folder.ID}`}
                                >
                                    <div data-level={folder.level} className="flex">
                                        <FolderIcon
                                            folder={folder}
                                            icon={folder.icon}
                                            className="shrink-0 mr-2 mt-0.5 color-primary"
                                        />
                                        <span className="text-ellipsis flex-1" title={folder.Name}>
                                            {folder.Name}
                                        </span>
                                        {selectedFolder?.ID === folder.ID && (
                                            <IcCheckmark className="text-success shrink-0 mt-0.5" />
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
