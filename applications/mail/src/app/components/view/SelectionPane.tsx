import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { Location } from 'history';
import { c, msgid } from 'ttag';

import { Button, Href } from '@proton/atoms';
import { FeatureCode, Loader, useFeature, useFolders, useLabels, useModalState } from '@proton/components';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { TelemetrySimpleLoginEvents } from '@proton/shared/lib/api/telemetry';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { MailSettings } from '@proton/shared/lib/interfaces';
import { LabelCount } from '@proton/shared/lib/interfaces/Label';
import conversationSvg from '@proton/styles/assets/img/illustrations/selected-emails.svg';

import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import { isSearch as testIsSearch } from '../../helpers/elements';
import { getLabelName, isCustomLabel as testIsCustomLabel } from '../../helpers/labels';
import { isConversationMode } from '../../helpers/mailSettings';
import { extractSearchParameters } from '../../helpers/mailboxUrl';
import { useSimpleLoginExtension } from '../../hooks/simpleLogin/useSimpleLoginExtension';
import { useSimpleLoginTelemetry } from '../../hooks/simpleLogin/useSimpleLoginTelemetry';
import { useDeepMemo } from '../../hooks/useDeepMemo';
import { total as totalSelector } from '../../logic/elements/elementsSelectors';
import { useAppSelector } from '../../logic/store';
import { SearchParameters } from '../../models/tools';
import EnableEncryptedSearchModal from '../header/search/AdvancedSearchFields/EnableEncryptedSearchModal';
import SimpleLoginPlaceholder from './SimpleLoginPlaceholder';

interface Props {
    labelID: string;
    mailSettings: MailSettings | undefined;
    location: Location;
    labelCount: LabelCount | undefined;
    checkedIDs?: string[];
    onCheckAll: (checked: boolean) => void;
}

const { SPAM } = MAILBOX_LABEL_IDS;

const SelectionPane = ({ labelID, mailSettings, location, labelCount, checkedIDs = [], onCheckAll }: Props) => {
    const appLocation = useLocation();
    const { feature: simpleLoginIntegrationFeature, loading: loadingSimpleLoadingFeature } = useFeature(
        FeatureCode.SLIntegration
    );
    const { hasSimpleLogin, isFetchingAccountLinked } = useSimpleLoginExtension();
    const { handleSendTelemetryData } = useSimpleLoginTelemetry();
    const [placeholderSLSeenSent, setPlaceholderSLSeenSent] = useState(false);
    const conversationMode = isConversationMode(labelID, mailSettings, location);

    // We display 50 elements maximum in the list. To know how much results are matching a search, we store it in Redux, in elements.total
    const elementsFoundCount = useAppSelector(totalSelector) || 0;

    const [labels] = useLabels();
    const [folders] = useFolders();

    const { getESDBStatus } = useEncryptedSearchContext();
    const { isEnablingContentSearch, isPaused, contentIndexingDone, isEnablingEncryptedSearch } = getESDBStatus();
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
        isEnablingContentSearch || isPaused || contentIndexingDone || isEnablingEncryptedSearch;

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
            return c('Info').ngettext(
                msgid`**${elementsFoundCount}** result found in ${labelName}`,
                `**${elementsFoundCount}** results found in ${labelName}`,
                elementsFoundCount
            );
        } else {
            return isCustomLabel ? getLabelText() : getFolderText();
        }
    };

    const text = getSelectionPaneText();

    const showText = checkeds || labelCount;

    const showSimpleLoginPlaceholder =
        simpleLoginIntegrationFeature?.Value && checkeds === 0 && labelID === SPAM && !hasSimpleLogin;

    // If the user sees the SL placeholder, we need to send once a telemetry request
    useEffect(() => {
        if (showSimpleLoginPlaceholder && !placeholderSLSeenSent) {
            // We need to send to telemetry the total number of messages that the user has in spam
            handleSendTelemetryData(TelemetrySimpleLoginEvents.spam_view, {}, false, total);
            setPlaceholderSLSeenSent(true);
        }
    }, [showSimpleLoginPlaceholder]);

    if (loadingSimpleLoadingFeature || isFetchingAccountLinked) {
        return (
            <div className="flex h100 py-4 px-7">
                <div className="m-auto text-center max-w30e">
                    <Loader />
                </div>
            </div>
        );
    }

    return (
        <div className="m-auto text-center p-7 max-w100" data-testid="section-pane--wrapper">
            {showSimpleLoginPlaceholder ? (
                <SimpleLoginPlaceholder />
            ) : (
                <>
                    {checkeds === 0 && labelName && (
                        <h3 className="text-bold lh-rg text-ellipsis" title={labelName}>
                            {labelName}
                        </h3>
                    )}
                    <div className="mb-8">
                        <p className="mb-2 text-keep-space">{showText ? getBoldFormattedText(text) : null}</p>
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
                    <div className="mb-8">
                        <img
                            src={conversationSvg}
                            alt={c('Alternative text for conversation image').t`Conversation`}
                            className="hauto"
                        />
                    </div>
                    {checkeds > 0 && <Button onClick={() => onCheckAll(false)}>{c('Action').t`Deselect`}</Button>}
                </>
            )}
            {renderEnableESModal && <EnableEncryptedSearchModal openSearchAfterEnabling {...enableESModalProps} />}
        </div>
    );
};

export default SelectionPane;
