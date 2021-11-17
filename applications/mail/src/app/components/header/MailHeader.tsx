import { useRef, useState, useEffect, memo } from 'react';
import { c } from 'ttag';
import { useLocation } from 'react-router-dom';
import {
    Searchbox,
    useLabels,
    useFolders,
    PrivateHeader,
    FloatingButton,
    MainLogo,
    Tooltip,
    TopNavbarListItemSettingsDropdown,
    TopNavbarListItemContactsDropdown,
    Icon,
    useModals,
    ConfirmModal,
    DropdownMenuButton,
} from '@proton/components';
import { MAILBOX_LABEL_IDS, APPS } from '@proton/shared/lib/constants';
import { Recipient } from '@proton/shared/lib/interfaces';
import AdvancedSearchDropdown from './AdvancedSearchDropdown';
import { extractSearchParameters, setParamsInUrl } from '../../helpers/mailboxUrl';
import { Breakpoints } from '../../models/utils';
import { getLabelName } from '../../helpers/labels';
import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import { useOnCompose, useOnMailTo } from '../../containers/ComposeProvider';
import { MESSAGE_ACTIONS } from '../../constants';

interface Props {
    labelID: string;
    elementID: string | undefined;
    breakpoints: Breakpoints;
    onSearch: (keyword?: string, labelID?: string) => void;
    expanded?: boolean;
    onToggleExpand: () => void;
}

const MailHeader = ({ labelID, elementID, breakpoints, expanded, onToggleExpand, onSearch }: Props) => {
    const location = useLocation();
    const { keyword = '' } = extractSearchParameters(location);
    const [value, updateValue] = useState(keyword);
    const oldLabelIDRef = useRef<string>(MAILBOX_LABEL_IDS.INBOX);
    const [labels = []] = useLabels();
    const [folders = []] = useFolders();
    const { cacheIndexedDB, getESDBStatus, esDelete } = useEncryptedSearchContext();
    const { dbExists, esEnabled } = getESDBStatus();
    const { createModal } = useModals();

    const onCompose = useOnCompose();
    const onMailTo = useOnMailTo();

    // Update the search input field when the keyword in the URL is changed
    useEffect(() => updateValue(keyword), [keyword]);

    const searchDropdown = <AdvancedSearchDropdown keyword={value} isNarrow={breakpoints.isNarrow} />;

    const searchBox = (
        <Searchbox
            delay={0}
            placeholder={c('Placeholder').t`Search messages`}
            onSearch={(keyword) => {
                if (keyword) {
                    oldLabelIDRef.current = labelID;
                }
                onSearch(keyword, keyword ? undefined : oldLabelIDRef.current);
            }}
            onChange={updateValue}
            value={value}
            advanced={searchDropdown}
            onFocus={() => cacheIndexedDB()}
        />
    );

    const handleContactsCompose = (emails: Recipient[], attachments: File[]) => {
        onCompose({
            action: MESSAGE_ACTIONS.NEW,
            referenceMessage: { data: { ToList: emails }, initialAttachments: attachments },
        });
    };

    const backUrl = setParamsInUrl(location, { labelID });
    const showBackButton = breakpoints.isNarrow && elementID;
    const labelName = getLabelName(labelID, labels, folders);
    const logo = <MainLogo to="/inbox" />;

    const handleDeleteESIndex = () => {
        createModal(
            <ConfirmModal
                onConfirm={esDelete}
                title={c('Info').t`Disable message content search`}
                confirm={c('Info').t`Clear data`}
                mode="alert"
            >
                {c('Info')
                    .t`Clearing browser data also deactivates message content search on this device. All messages will need to be downloaded again to search within them.`}
            </ConfirmModal>
        );
    };
    const clearDataButton =
        dbExists || esEnabled ? (
            <>
                <hr className="mt0-5 mb0-5" />
                <Tooltip
                    title={c('Info')
                        .t`Clears browser data related to message content search including downloaded messages`}
                >
                    <DropdownMenuButton onClick={handleDeleteESIndex} className="flex flex-nowrap flex-justify-center">
                        <span className="color-weak">{c('Action').t`Clear browser data`}</span>
                    </DropdownMenuButton>
                </Tooltip>
            </>
        ) : null;

    return (
        <PrivateHeader
            logo={logo}
            backUrl={showBackButton && backUrl ? backUrl : undefined}
            title={labelName}
            settingsButton={
                <TopNavbarListItemSettingsDropdown to="/mail" toApp={APPS.PROTONACCOUNT}>
                    {clearDataButton}
                </TopNavbarListItemSettingsDropdown>
            }
            contactsButton={<TopNavbarListItemContactsDropdown onCompose={handleContactsCompose} onMailTo={onMailTo} />}
            searchBox={searchBox}
            searchDropdown={searchDropdown}
            expanded={!!expanded}
            onToggleExpand={onToggleExpand}
            isNarrow={breakpoints.isNarrow}
            floatingButton={
                <FloatingButton onClick={() => onCompose({ action: MESSAGE_ACTIONS.NEW })}>
                    <Icon size={24} name="pen" className="mauto" />
                </FloatingButton>
            }
        />
    );
};

export default memo(MailHeader);
