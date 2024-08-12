import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import type { Location } from 'history';
import { c, msgid } from 'ttag';

import { Button, Href } from '@proton/atoms';
import { useFolders, useLabels, useModalState } from '@proton/components';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import type { LabelCount } from '@proton/shared/lib/interfaces/Label';
import conversationSvg from '@proton/styles/assets/img/illustrations/selected-emails.svg';

import { useSelectAll } from 'proton-mail/hooks/useSelectAll';
import { useMailSelector } from 'proton-mail/store/hooks';

import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import { isSearch as testIsSearch } from '../../helpers/elements';
import { getLabelName, isCustomLabel as testIsCustomLabel } from '../../helpers/labels';
import { isConversationMode } from '../../helpers/mailSettings';
import { extractSearchParameters } from '../../helpers/mailboxUrl';
import { useDeepMemo } from '../../hooks/useDeepMemo';
import type { SearchParameters } from '../../models/tools';
import { total as totalSelector } from '../../store/elements/elementsSelectors';
import EnableEncryptedSearchModal from '../header/search/AdvancedSearchFields/EnableEncryptedSearchModal';
import ProtonPassPlaceholder from './ProtonPassPlaceholder';

import './SelectionPane.scss';

interface Props {
    labelID: string;
    mailSettings: MailSettings;
    location: Location;
    labelCount: LabelCount | undefined;
    checkedIDs?: string[];
    onCheckAll: (checked: boolean) => void;
}

const { SPAM } = MAILBOX_LABEL_IDS;

const SelectionPane = ({ labelID, mailSettings, location, labelCount, checkedIDs = [], onCheckAll }: Props) => {
    const appLocation = useLocation();
    const conversationMode = isConversationMode(labelID, mailSettings, location);
    const { selectAll, setSelectAll, getBannerTextWithLocation } = useSelectAll({ labelID });

    // We display 50 elements maximum in the list. To know how much results are matching a search, we store it in Redux, in elements.total
    const elementsFoundCount = useMailSelector(totalSelector) || 0;

    const [labels] = useLabels();
    const [folders] = useFolders();

    const { esStatus } = useEncryptedSearchContext();
    const { isEnablingContentSearch, isContentIndexingPaused, contentIndexingDone, isEnablingEncryptedSearch } =
        esStatus;
    const [enableESModalProps, setEnableESModalOpen, renderEnableESModal] = useModalState();

    const isCustomLabel = testIsCustomLabel(labelID, labels);
    const total = labelCount?.Total || 0;
    const checkeds = checkedIDs.length;

    const labelName = useMemo(() => getLabelName(labelID, labels, folders), [labelID, labels, folders]);

    const count = checkeds || total;

    const searchParameters = useDeepMemo<SearchParameters>(() => extractSearchParameters(appLocation), [appLocation]);
    const isSearch = testIsSearch(searchParameters);

    // We want to hide the "enable ES" part from the point when the user enables it. We do not want to see the downloading part from here
    const encryptedSearchEnabled =
        isEnablingContentSearch || isContentIndexingPaused || contentIndexingDone || isEnablingEncryptedSearch;

    const handleClearSelection = () => {
        if (selectAll) {
            setSelectAll(false);
        }
        onCheckAll(false);
    };

    /*
     * With ttag we cannot have JSX in plural forms
     * We need a workaround to have the number of messages/conversations in a strong tag
     * So we are surrounding the bold part with ** to replace it later by a strong tag
     */
    const getFolderText = () => {
        if (checkeds) {
            // translator: To have plural forms AND a part in bold, we need to surround the bold part with "**" so that we can replace it by a <strong> tag in the code. Here, "{count} conversation/s" will be bold. You need to put them in your translation too.
            return conversationMode
                ? c('Info').ngettext(
                      msgid`You selected **${count} conversation** from this folder`,
                      `You selected **${count} conversations** from this folder`,
                      count
                  )
                : // translator: To have plural forms AND a part in bold, we need to surround the bold part with "**" so that we can replace it by a <strong> tag in the code. Here, "{count} message/s" will be bold. You need to put them in your translation too.
                  c('Info').ngettext(
                      msgid`You selected **${count} message** from this folder`,
                      `You selected **${count} messages** from this folder`,
                      count
                  );
        }
        // translator: To have plural forms AND a part in bold, we need to surround the bold part with "**" so that we can replace it by a <strong> tag in the code. Here, "{count} conversation/s" will be bold. You need to put them in your translation too.
        return conversationMode
            ? c('Info').ngettext(
                  msgid`You have **${count} conversation** stored in this folder`,
                  `You have **${count} conversations** stored in this folder`,
                  count
              )
            : // translator: To have plural forms AND a part in bold, we need to surround the bold part with "**" so that we can replace it by a <strong> tag in the code. Here, "{count} message/s" will be bold. You need to put them in your translation too.
              c('Info').ngettext(
                  msgid`You have **${count} message** stored in this folder`,
                  `You have **${count} messages** stored in this folder`,
                  count
              );
    };

    /*
     * With ttag we cannot have JSX in plural forms
     * We need a workaround to have the number of messages/conversations in a strong tag
     * So we are surrounding the bold part with ** to replace it later by a strong tag
     */
    const getLabelText = () => {
        if (checkeds) {
            // translator: To have plural forms AND a part in bold, we need to surround the bold part with "**" so that we can replace it by a <strong> tag in the code. Here, "{count} conversation/s" will be bold. You need to put them in your translation too.
            return conversationMode
                ? c('Info').ngettext(
                      msgid`You selected **${count} conversation** with this label`,
                      `You selected **${count} conversations** with this label`,
                      count
                  )
                : // translator: To have plural forms AND a part in bold, we need to surround the bold part with "**" so that we can replace it by a <strong> tag in the code. Here, "{count} message/s" will be bold. You need to put them in your translation too.
                  c('Info').ngettext(
                      msgid`You selected **${count} message** with this label`,
                      `You selected **${count} messages** with this label`,
                      count
                  );
        }
        // translator: To have plural forms AND a part in bold, we need to surround the bold part with "**" so that we can replace it by a <strong> tag in the code. Here, "{count} conversation/s" will be bold. You need to put them in your translation too.
        return conversationMode
            ? c('Info').ngettext(
                  msgid`You have **${count} conversation** tagged with this label`,
                  `You have **${count} conversations** tagged with this label`,
                  count
              )
            : // translator: To have plural forms AND a part in bold, we need to surround the bold part with "**" so that we can replace it by a <strong> tag in the code. Here, "{count} message/s" will be bold. You need to put them in your translation too.
              c('Info').ngettext(
                  msgid`You have **${count} message** tagged with this label`,
                  `You have **${count} messages** tagged with this label`,
                  count
              );
    };

    const getSelectionPaneText = () => {
        if (isSearch && !checkeds) {
            /* translator: To have plural forms AND a part in bold, we need to surround the bold part with "**" so that we can replace it by a <strong> tag in the code. Here, "{numberOfElements} result/s" will be bold. You need to put them in your translation too.
             * ${elementsFoundCount} is the number of elements found during search
             * ${labelName} is the name of the label/folder the in which the user is performing a search
             * Full string for reference: 3 results found in Inbox
             */
            const text = c('Info').ngettext(
                msgid`**${elementsFoundCount}** result found in ${labelName}`,
                `**${elementsFoundCount}** results found in ${labelName}`,
                elementsFoundCount
            );

            return getBoldFormattedText(text);
        } else {
            if (selectAll) {
                const bannerText = getBannerTextWithLocation();
                // Warning, we are forced to add a custom class here (ttag does not support JSX + plural forms)
                // And we need to style the last span of the string so that it does not overflow
                // In case the string it updated, do not forget to update the style if necessary
                return (
                    <span className="selection-pane" title={bannerText}>
                        {getBoldFormattedText(bannerText)}
                    </span>
                );
            }
            return getBoldFormattedText(isCustomLabel ? getLabelText() : getFolderText());
        }
    };

    const text = getSelectionPaneText();

    const showText = checkeds || labelCount;

    const showSimpleLoginPlaceholder = checkeds === 0 && labelID === SPAM;

    return (
        <div className="m-auto text-center p-7 max-w-full" data-testid="section-pane--wrapper">
            {showSimpleLoginPlaceholder ? (
                <ProtonPassPlaceholder />
            ) : (
                <>
                    <div className="mb-8">
                        {isSearch && !encryptedSearchEnabled && (
                            <>
                                <p>
                                    {c('Info')
                                        .t`For more search results, try searching for this keyword in the content of your email messages.`}
                                    <br />
                                    <Href href={getKnowledgeBaseUrl('/search-message-content')}>
                                        {c('Info').t`Learn more`}
                                    </Href>
                                </p>
                                <Button
                                    onClick={() => setEnableESModalOpen(true)}
                                    data-testid="encrypted-search:activate"
                                >
                                    {c('Action').t`Enable`}
                                </Button>
                            </>
                        )}
                    </div>
                    <div className="mb-2">
                        <img src={conversationSvg} width={144} height={101} alt="" />
                    </div>
                    {checkeds === 0 && labelName && (
                        <h3 className="lh-rg text-ellipsis" title={labelName}>
                            {labelName}
                        </h3>
                    )}
                    <p className="my-2 text-keep-space">{showText ? text : null}</p>
                    {checkeds > 0 && <Button onClick={handleClearSelection}>{c('Action').t`Clear selection`}</Button>}
                </>
            )}
            {renderEnableESModal && <EnableEncryptedSearchModal openSearchAfterEnabling {...enableESModalProps} />}
        </div>
    );
};

export default SelectionPane;
