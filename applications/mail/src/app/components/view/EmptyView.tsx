import { c } from 'ttag';

import { Button, Href } from '@proton/atoms';
import { EmptyViewContainer, useModalState, useTheme } from '@proton/components';
import { getPlaceholderSrc } from '@proton/mail';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import noSpamSvgDark from '@proton/styles/assets/img/placeholders/auto-delete-cool-dark.svg';
import noSpamSvgCool from '@proton/styles/assets/img/placeholders/auto-delete-cool-light.svg';
import noSpamSvgWarm from '@proton/styles/assets/img/placeholders/auto-delete-warm-light.svg';
import {
    default as noResultFolderSvgDark,
    default as noUnreadSvgDark,
} from '@proton/styles/assets/img/placeholders/inbox-empty-cool-dark.svg';
import {
    default as noResultFolderSvgCool,
    default as noUnreadSvgCool,
} from '@proton/styles/assets/img/placeholders/inbox-empty-cool-light.svg';
import {
    default as noResultFolderSvgWarm,
    default as noUnreadSvgWarm,
} from '@proton/styles/assets/img/placeholders/inbox-empty-warm-light.svg';
import noSearchResultDark from '@proton/styles/assets/img/placeholders/search-empty-cool-dark.svg';
import noSearchResultCool from '@proton/styles/assets/img/placeholders/search-empty-cool-light.svg';
import noSearchResultWarm from '@proton/styles/assets/img/placeholders/search-empty-warm-light.svg';
import noTrashSvgDark from '@proton/styles/assets/img/placeholders/trash-empty-cool-dark.svg';
import noTrashSvgCool from '@proton/styles/assets/img/placeholders/trash-empty-cool-light.svg';
import noTrashSvgWarm from '@proton/styles/assets/img/placeholders/trash-empty-warm-light.svg';

import { MESSAGE_ACTIONS } from '../../constants';
import { useOnCompose } from '../../containers/ComposeProvider';
import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import { ComposeTypes } from '../../hooks/composer/useCompose';
import EnableEncryptedSearchModal from '../header/search/AdvancedSearchFields/EnableEncryptedSearchModal';
import ProtonPassPlaceholder from './ProtonPassPlaceholder';

interface Props {
    labelID: string;
    isSearch: boolean;
    isUnread: boolean;
}

const EmptyView = ({ labelID, isSearch, isUnread }: Props) => {
    const theme = useTheme();

    const { esStatus } = useEncryptedSearchContext();
    const { isEnablingContentSearch, isContentIndexingPaused, contentIndexingDone, isEnablingEncryptedSearch } =
        esStatus;
    const [enableESModalProps, setEnableESModalOpen, renderEnableESModal] = useModalState();

    const isInbox = labelID === MAILBOX_LABEL_IDS.INBOX && !isSearch;
    const isScheduled = labelID === MAILBOX_LABEL_IDS.SCHEDULED && !isSearch;
    const isSnoozed = labelID === MAILBOX_LABEL_IDS.SNOOZED && !isSearch;
    const isSpam = labelID === MAILBOX_LABEL_IDS.SPAM && !isSearch;
    const isTrash = labelID === MAILBOX_LABEL_IDS.TRASH && !isSearch;
    const isFolder = !isInbox && !isScheduled && !isSnoozed && !isSearch && !isSpam && !isTrash;

    // We want to hide the "enable ES" part from the point when the user enables it. We do not want to see the downloading part from here
    const encryptedSearchEnabled =
        isEnablingContentSearch || isContentIndexingPaused || contentIndexingDone || isEnablingEncryptedSearch;

    const onCompose = useOnCompose();

    const scheduleCTAButton = (
        <Button
            title={c('Action').t`Create new message`}
            onClick={() => onCompose({ type: ComposeTypes.newMessage, action: MESSAGE_ACTIONS.NEW })}
        >
            {c('Action').t`Create new message`}
        </Button>
    );

    const folderPicture = getPlaceholderSrc({
        theme: theme.information.theme,
        warmLight: noResultFolderSvgWarm,
        coolLight: noResultFolderSvgCool,
        coolDark: noResultFolderSvgDark,
    });

    const imageProps = (() => {
        if (isSpam) {
            return {
                src: getPlaceholderSrc({
                    theme: theme.information.theme,
                    warmLight: noSpamSvgWarm,
                    coolLight: noSpamSvgCool,
                    coolDark: noSpamSvgDark,
                }),
                alt: c('Search - no results').t`No messages found`,
            };
        }
        if (isUnread) {
            return {
                src: getPlaceholderSrc({
                    theme: theme.information.theme,
                    warmLight: noUnreadSvgWarm,
                    coolLight: noUnreadSvgCool,
                    coolDark: noUnreadSvgDark,
                }),
                alt: c('Search - no results').t`No unread messages found`,
            };
        }
        if (isSearch) {
            return {
                src: getPlaceholderSrc({
                    theme: theme.information.theme,
                    warmLight: noSearchResultWarm,
                    coolLight: noSearchResultCool,
                    coolDark: noSearchResultDark,
                }),
                alt: c('Search - no results').t`No results found`,
            };
        }
        if (isFolder) {
            return {
                src: folderPicture,
                alt: c('Search - no results').t`No messages found`,
            };
        }
        if (isInbox) {
            return {
                src: folderPicture,
                alt: c('Search - no results').t`No messages found`,
            };
        }
        if (isScheduled) {
            return {
                src: folderPicture,
                alt: c('Search - no results').t`No messages scheduled`,
            };
        }
        if (isSnoozed) {
            return {
                src: folderPicture,
                alt: c('Search - no results').t`No snoozed messages`,
            };
        }
        if (isTrash) {
            return {
                src: getPlaceholderSrc({
                    theme: theme.information.theme,
                    warmLight: noTrashSvgWarm,
                    coolLight: noTrashSvgCool,
                    coolDark: noTrashSvgDark,
                }),
                alt: c('Search - no results').t`No messages found`,
            };
        }
    })();

    return isSpam ? (
        <div className="m-auto text-center p-7 max-w-full">
            <ProtonPassPlaceholder />
        </div>
    ) : (
        <EmptyViewContainer imageProps={imageProps} height={128}>
            <h3 className="text-bold" data-testid="empty-view-placeholder--empty-title">
                {isSearch
                    ? c('Search - no results').t`No results found`
                    : isFolder
                      ? c('Search - no results').t`No messages found`
                      : isScheduled
                        ? c('Search - no results').t`No messages scheduled`
                        : c('Search - no results').t`No messages found`}
            </h3>
            <p>
                {isSearch ? (
                    // TODO: Add a link on clear it when search will work
                    <>
                        {encryptedSearchEnabled ? (
                            <>{c('Info').t`You can either update your search query or clear it`}</>
                        ) : (
                            <>
                                {c('Info')
                                    .t`For more search results, try searching for this keyword in the content of your email messages.`}
                                <br />
                                <Href href={getKnowledgeBaseUrl('/search-message-content')}>
                                    {c('Info').t`Learn more`}
                                </Href>
                            </>
                        )}
                    </>
                ) : isFolder ? (
                    c('Info').t`You do not have any messages here`
                ) : isScheduled ? (
                    scheduleCTAButton
                ) : (
                    c('Info').t`Seems like you are all caught up for now`
                )}
            </p>
            {isSearch && !encryptedSearchEnabled && (
                <Button onClick={() => setEnableESModalOpen(true)} data-testid="encrypted-search:activate">
                    {c('Action').t`Enable`}
                </Button>
            )}
            {renderEnableESModal && <EnableEncryptedSearchModal openSearchAfterEnabling {...enableESModalProps} />}
        </EmptyViewContainer>
    );
};

export default EmptyView;
