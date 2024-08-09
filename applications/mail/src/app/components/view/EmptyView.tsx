import { c } from 'ttag';

import { Button, Href } from '@proton/atoms';
import { EmptyViewContainer, useModalState } from '@proton/components';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import noResultInboxSvg from '@proton/styles/assets/img/illustrations/empty-mailbox.svg';
import noResultSearchSvg from '@proton/styles/assets/img/illustrations/empty-search.svg';
import noSpamSvg from '@proton/styles/assets/img/illustrations/no-messages-in-spam.svg';
import noUnreadSvg from '@proton/styles/assets/img/illustrations/no-unread-messages.svg';

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
    const { esStatus } = useEncryptedSearchContext();
    const { isEnablingContentSearch, isContentIndexingPaused, contentIndexingDone, isEnablingEncryptedSearch } =
        esStatus;
    const [enableESModalProps, setEnableESModalOpen, renderEnableESModal] = useModalState();

    const isInbox = labelID === MAILBOX_LABEL_IDS.INBOX && !isSearch;
    const isScheduled = labelID === MAILBOX_LABEL_IDS.SCHEDULED && !isSearch;
    const isSnoozed = labelID === MAILBOX_LABEL_IDS.SNOOZED && !isSearch;
    const isSpam = labelID === MAILBOX_LABEL_IDS.SPAM && !isSearch;
    const isFolder = !isInbox && !isScheduled && !isSnoozed && !isSearch && !isSpam;

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

    const imageProps = (() => {
        if (isSpam) {
            return { src: noSpamSvg, alt: c('Search - no results').t`No messages found` };
        }
        if (isUnread) {
            return { src: noUnreadSvg, alt: c('Search - no results').t`No unread messages found` };
        }
        if (isSearch) {
            return { src: noResultSearchSvg, alt: c('Search - no results').t`No results found` };
        }
        if (isFolder) {
            return { src: noResultSearchSvg, alt: c('Search - no results').t`No messages found` };
        }
        if (isInbox) {
            return { src: noResultInboxSvg, alt: c('Search - no results').t`No messages found` };
        }
        if (isScheduled) {
            return { src: noResultSearchSvg, alt: c('Search - no results').t`No messages scheduled` };
        }
        if (isSnoozed) {
            return { src: noResultSearchSvg, alt: c('Search - no results').t`No snoozed messages` };
        }
    })();

    return isSpam ? (
        <div className="m-auto text-center p-7 max-w-full">
            <ProtonPassPlaceholder />
        </div>
    ) : (
        <EmptyViewContainer imageProps={imageProps}>
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
