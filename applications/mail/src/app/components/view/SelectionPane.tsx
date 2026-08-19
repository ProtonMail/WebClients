import type { PropsWithChildren } from 'react';
import { useLocation } from 'react-router-dom';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { useTheme } from '@proton/components/containers/themes/ThemeProvider';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { getInboxEmptyPlaceholder } from '@proton/mail/helpers/getPlaceholderSrc';
import { isCustomLabel as testIsCustomLabel } from '@proton/mail/helpers/location';
import { useFolders, useLabels } from '@proton/mail/store/labels/hooks';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { SearchParameters } from '@proton/shared/lib/mail/search';

import { useSelectAll } from '../../hooks/useSelectAll';
import { useMailSelector } from '../../store/hooks';

import { isSearch as testIsSearch } from '../../helpers/elements';
import { getLabelName } from '../../helpers/labels';
import { isConversationMode } from '../../helpers/mailSettings';
import { extractSearchParameters } from '../../helpers/mailboxUrl';
import { useDeepMemo } from '../../hooks/useDeepMemo';
import {
    contextTotal,
    loadedEmpty,
    selectActiveCategoryID,
    selectLabelID,
    taskRunningInLabel,
} from '../../store/elements/elementsSelectors';
import EmptyView from './EmptyView/EmptyView';
import ProtonPassPlaceholder from './ProtonPassPlaceholder';
import { getCategoryText, getFolderText, getLabelText } from './SelectionPane.strings';

import './SelectionPane.scss';

const SelectionPaneWrapper = ({ children }: PropsWithChildren) => {
    return (
        <section
            className="m-auto text-center p-7 max-w-full"
            data-testid="section-pane--wrapper"
            aria-label={c('Info').t`Selection pane`}
        >
            {children}
        </section>
    );
};

interface Props {
    checkedIDs?: string[];
    onCheckAll: (checked: boolean) => void;
}

const SelectionPane = ({ checkedIDs = [], onCheckAll }: Props) => {
    const theme = useTheme();
    const location = useLocation();
    const [mailSettings] = useMailSettings();

    const labelID = useMailSelector(selectLabelID);

    const appLocation = useLocation();
    const conversationMode = isConversationMode(labelID, mailSettings, location);
    const { selectAll, setSelectAll, getBannerTextWithLocation } = useSelectAll({ labelID });
    const [labels] = useLabels();
    const [folders] = useFolders();

    const taskIsRunningInLabel = useMailSelector((state) => taskRunningInLabel(state, { labelID }));
    const isLoadedEmpty = useMailSelector(loadedEmpty);

    const categoryID = useMailSelector(selectActiveCategoryID);
    const total = useMailSelector(contextTotal) || 0;

    const isCustomLabel = testIsCustomLabel(labelID, labels);
    const checkeds = checkedIDs.length;
    const count = checkeds || total;

    const labelName = getLabelName(labelID, labels, folders);
    const searchParameters = useDeepMemo<SearchParameters>(() => extractSearchParameters(appLocation), [appLocation]);
    const isSearch = testIsSearch(searchParameters);

    const handleClearSelection = () => {
        if (selectAll) {
            setSelectAll(false);
        }
        onCheckAll(false);
    };

    const getSelectionPaneText = () => {
        // Search still wins inside a category (preserves "N results found in X")
        if (isSearch && !checkeds) {
            if (total === 0) {
                return undefined;
            }

            const text = c('Info').ngettext(
                msgid`**${total}** result found in ${labelName}`,
                `**${total}** results found in ${labelName}`,
                total
            );
            return getBoldFormattedText(text);
        }

        if (selectAll) {
            const bannerText = getBannerTextWithLocation();
            return (
                <span className="selection-pane" title={bannerText}>
                    {getBoldFormattedText(bannerText)}
                </span>
            );
        }

        if (categoryID) {
            return getBoldFormattedText(getCategoryText(checkeds, total, conversationMode, categoryID));
        }

        if (total === 0) {
            return undefined;
        }

        if (isSearch && !checkeds) {
            /* translator: To have plural forms AND a part in bold, we need to surround the bold part with "**" so that we can replace it by a <strong> tag in the code. Here, "{numberOfElements} result/s" will be bold. You need to put them in your translation too.
             * ${total} is the number of elements found during search
             * ${labelName} is the name of the label/folder the in which the user is performing a search
             * Full string for reference: 3 results found in Inbox
             */
            const text = c('Info').ngettext(
                msgid`**${total}** result found in ${labelName}`,
                `**${total}** results found in ${labelName}`,
                total
            );

            return getBoldFormattedText(text);
        }

        return getBoldFormattedText(
            isCustomLabel
                ? getLabelText(checkeds, count, conversationMode)
                : getFolderText(checkeds, count, conversationMode)
        );
    };

    if (isSearch && isLoadedEmpty) {
        return <EmptyView isSearch isUnread={false} labelID={labelID} isTaskRunningInLabel={!!taskIsRunningInLabel} />;
    }

    if (checkeds === 0 && labelID === MAILBOX_LABEL_IDS.SPAM) {
        return (
            <SelectionPaneWrapper>
                <ProtonPassPlaceholder />
            </SelectionPaneWrapper>
        );
    }

    const text = getSelectionPaneText();
    return (
        <SelectionPaneWrapper>
            <div className="mb-2">
                <img
                    src={getInboxEmptyPlaceholder({ size: count, theme: theme.information.theme })}
                    className="w-auto"
                    height={128}
                    alt=""
                />
            </div>

            {checkeds === 0 && labelName && (
                <h1 className="text-lg text-semibold color-weak text-ellipsis" title={labelName}>
                    {labelName}
                </h1>
            )}
            <p className="my-2 color-weak text-keep-space">{text}&nbsp;</p>
            {checkeds > 0 && <Button onClick={handleClearSelection}>{c('Action').t`Clear selection`}</Button>}
        </SelectionPaneWrapper>
    );
};

export default SelectionPane;
