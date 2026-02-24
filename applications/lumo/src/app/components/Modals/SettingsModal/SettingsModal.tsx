import React, { useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Avatar } from '@proton/atoms/Avatar/Avatar';
import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import type { ModalOwnProps } from '@proton/components/index';
import { Icon, ModalTwo, ModalTwoContent, SettingsLink, Toggle, useConfig } from '@proton/components/index';
import type { IconName } from '@proton/icons/types';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { format } from '@proton/shared/lib/date-fns-utc';
import { dateLocale } from '@proton/shared/lib/i18n';
import lumoAvatarNeutral from '@proton/styles/assets/img/lumo/lumo-avatar-neutral.svg';

import { useLumoUserSettings } from '../../../hooks';
import { useDriveFolderIndexing } from '../../../hooks/useDriveFolderIndexing';
import { useLumoFlags } from '../../../hooks/useLumoFlags';
import { useLumoPlan } from '../../../hooks/useLumoPlan';
import { useMessageSearch } from '../../../hooks/useMessageSearch';
import { DbApi } from '../../../indexedDb/db';
import { useIsGuest } from '../../../providers/IsGuestProvider';
import { useLumoTheme } from '../../../providers';
import { useLumoSelector } from '../../../redux/hooks';
import { selectAttachments, selectConversations, selectMessages } from '../../../redux/selectors';
import { selectSpaceMap } from '../../../redux/slices/core/spaces';
import { SearchService } from '../../../services/search/searchService';
import type { Conversation, Message, SpaceId } from '../../../types';
import { getInitials } from '../../../util/username';
import { LumoSettingsPanelUpsell } from '../../../upsells';
import CreateFreeAccountLink from '../../CreateFreeAccountLink/CreateFreeAccountLink';
import { IndexingStatusBanner } from '../../Files/DriveBrowser/IndexingStatusBanner';
import { LumoLogoThemeAware } from '../../Icons/LumoLogoThemeAware';
import LumoThemeButton from '../../Buttons/LumoThemeButton';
import { SignInLinkButton } from '../../Links/SignInLink';
import DeleteAllButton from './DeleteAllButton';
import { PaidSubscriptionPanel } from './PaidSubscriptionPanel';
import PersonalizationPanel from './PersonalizationPanel';
import { SearchIndexManagement } from './SearchIndex/SearchIndexManagement';

import './SettingsModal.scss';

const SettingsSectionItem = ({
    icon,
    text,
    subtext,
    button,
    useEllipsisOnContent,
}: {
    icon: IconName;
    text: string | React.ReactNode;
    subtext?: string | React.ReactNode;
    button?: React.ReactNode;
    useEllipsisOnContent?: boolean;
}) => {
    const subTextContent =
        typeof subtext === 'string' ? (
            <span
                className={clsx('color-weak', useEllipsisOnContent && 'text-ellipsis')}
                title={useEllipsisOnContent ? subtext : undefined}
            >
                {subtext}
            </span>
        ) : (
            subtext
        );

    return (
        <div className="flex flex-row flex-nowrap gap-4 items-start p-2">
            <Avatar color="weak" className="settings-section-icon">
                <Icon className="shrink-0 color-weak" name={icon} size={5} />
            </Avatar>
            <div className="flex-1 flex flex-column *:min-size-auto sm:flex-row flex-nowrap gap-2">
                <div className="flex flex-column flex-nowrap flex-1 min-w-0">
                    {typeof text === 'string' ? (
                        <span
                            className={clsx('text-semibold', useEllipsisOnContent && 'text-ellipsis')}
                            title={useEllipsisOnContent ? text : undefined}
                        >
                            {text}
                        </span>
                    ) : (
                        text
                    )}
                    {subtext ? subTextContent : null}
                </div>
                <div className="shrink-0 my-auto">{button}</div>
            </div>
        </div>
    );
};

interface SettingsItem {
    id: string;
    icon: IconName;
    getText: () => string;
    guest: boolean;
}

const SettingsItems: SettingsItem[] = [
    {
        id: 'account',
        icon: 'user',
        getText: () => c('collider_2025: Settings Item').t`Account`,
        guest: true,
    },
    {
        id: 'personalization',
        icon: 'sliders',
        getText: () => c('collider_2025: Settings Item').t`Personalization`,
        guest: true,
    },
    { id: 'general', icon: 'cog-wheel', getText: () => c('collider_2025: Settings Item').t`General`, guest: true },
];
const LumoSettingsSidebar = ({
    activePanel,
    onPanelChange,
    isGuest,
}: {
    activePanel: string;
    onPanelChange: (panel: string) => void;
    isGuest: boolean;
}) => {
    return (
        <div
            className="flex flex-column gap-6 md:max-w-custom md:w-custom"
            style={{ '--md-max-w-custom': '14rem', '--md-w-custom': '10rem' }}
        >
            {/* Lumo Logo */}
            <div className="hidden md:flex gap-2">
                <img src={lumoAvatarNeutral} alt="Lumo" height="50px" />
                <LumoLogoThemeAware height="32px" />
            </div>

            {/* Navigation Items */}
            <ul className="unstyled m-0 flex flex-row md:flex-column flex-nowrap gap-2 md:gap-4 mb-4">
                {SettingsItems.map((item) => (
                    <li key={item.id}>
                        <Button
                            shape="ghost"
                            className={clsx(
                                'flex flex-row gap-2 items-center flex-nowrap',
                                activePanel === item.id && 'is-active'
                            )}
                            onClick={() => onPanelChange(item.id)}
                            fullWidth
                            disabled={isGuest && !item.guest}
                            aria-pressed={activePanel === item.id}
                        >
                            <Icon className="shrink-0" name={item.icon} />
                            <span className="text-ellipsis">{item.getText()}</span>
                        </Button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

/** Guest-safe General settings panel - only shows theme and about */
const GeneralSettingsPanelGuest = () => {
    const { DATE_VERSION } = useConfig();
    const { isDarkLumoTheme } = useLumoTheme();
    const formattedDate = DATE_VERSION ? `${format(new Date(DATE_VERSION), 'PPpp', { locale: dateLocale })} UTC` : '';

    return (
        <div className="flex flex-column gap-4">
            <div className="flex flex-column flex-nowrap gap-4 mb-4">
                <SettingsSectionItem
                    icon={isDarkLumoTheme ? 'moon' : 'sun'}
                    text={c('collider_2025: Title').t`Theme`}
                    subtext={c('collider_2025: Description').t`Switch between light and dark mode`}
                />
                <LumoThemeButton />
            </div>

            <SettingsSectionItem
                icon="info-circle"
                text={c('collider_2025: Title').t`About ${LUMO_SHORT_APP_NAME}`}
                subtext={c('collider_2025: Description').jt`Last updated on ${formattedDate}`}
            />
        </div>
    );
};

/** Full General settings panel for authenticated users */
const GeneralSettingsPanelAuth = ({ onClose }: { onClose?: () => void }) => {
    const { DATE_VERSION } = useConfig();
    const { isDarkLumoTheme } = useLumoTheme();
    const { externalTools: isLumoToolingEnabled } = useLumoFlags();
    const [user] = useUser();
    const userId = user?.ID;
    const { lumoUserSettings, updateSettings } = useLumoUserSettings();
    const showProjectConversationsInHistory = lumoUserSettings.showProjectConversationsInHistory ?? false;
    const automaticWebSearch = lumoUserSettings.automaticWebSearch ?? false;

    // Index management state
    const conversations = useLumoSelector(selectConversations);
    const messages = useLumoSelector(selectMessages);
    const spaceMap = useLumoSelector(selectSpaceMap);
    const attachments = useLumoSelector(selectAttachments);
    const { indexingStatus: messageIndexingStatus } = useMessageSearch();
    const {
        rehydrateFolders,
        isIndexing: isDriveIndexing,
        indexingStatus: driveIndexingStatus,
    } = useDriveFolderIndexing();
    const [isIndexing, setIsIndexing] = useState(false);
    const [indexError, setIndexError] = useState<string | null>(null);

    const handleReindex = React.useCallback(async () => {
        if (isIndexing || isDriveIndexing || !userId) {
            return;
        }

        setIsIndexing(true);
        setIndexError(null);

        try {
            const db = new DbApi(userId);
            await db.initialize();
            await db.clearAllSearchBlobs(['search_index_key', 'bm25_index', 'drive_manifest']);
            await new Promise((resolve) => setTimeout(resolve, 500));

            const searchService = SearchService.get(userId);
            if (!searchService) {
                setIndexError(c('collider_2025: Error').t`Search service not available`);
                return;
            }

            const conversationList = Object.values(conversations) as Conversation[];
            const conversationsWithMessages: Record<string, any> = {};
            for (const conversation of conversationList) {
                const conversationMessages = Object.values(messages).filter(
                    (msg: Message) => msg.conversationId === conversation.id
                ) as Message[];
                conversationsWithMessages[conversation.id] = {
                    ...conversation,
                    messages: conversationMessages,
                };
            }

            try {
                await searchService.populateEngine(conversationsWithMessages);
            } catch (error) {
                console.error('[Settings] Conversation populate failed:', error);
            }

            const validSpaceIds = new Set<SpaceId>(Object.keys(spaceMap) as SpaceId[]);
            await rehydrateFolders(validSpaceIds);

            // Reindex uploaded project attachments (non-Drive files)
            try {
                const attachmentList = Object.values(attachments);
                if (attachmentList.length > 0) {
                    console.log('[Settings] Reindexing uploaded attachments...');
                    const result = await searchService.reindexUploadedAttachments(attachmentList);
                    console.log('[Settings] Attachment reindexing result:', result);
                }
            } catch (error) {
                console.error('[Settings] Attachment reindexing failed:', error);
            }
        } catch (error) {
            console.error('[Settings] Re-indexing failed:', error);
            setIndexError(c('collider_2025: Error').t`Re-indexing failed. Please try again.`);
        } finally {
            setIsIndexing(false);
        }
    }, [conversations, messages, isIndexing, isDriveIndexing, userId, rehydrateFolders, spaceMap, attachments]);

    const formattedDate = DATE_VERSION ? `${format(new Date(DATE_VERSION), 'PPpp', { locale: dateLocale })} UTC` : '';
    const showIndexingProgress = isDriveIndexing && driveIndexingStatus;
    const hasError = indexError || messageIndexingStatus.error;

    return (
        <div className="flex flex-column gap-4">
            <div className="flex flex-column flex-nowrap gap-4 mb-4">
                <SettingsSectionItem
                    icon={isDarkLumoTheme ? 'moon' : 'sun'}
                    text={c('collider_2025: Title').t`Theme`}
                    subtext={c('collider_2025: Description').t`Switch between light and dark mode`}
                />
                <LumoThemeButton />
            </div>

            {/* Project conversations in history toggle */}
            <SettingsSectionItem
                icon="folder"
                text={c('collider_2025: Title').t`Show project chats in history`}
                subtext={c('collider_2025: Description').t`Include project conversations in the main chat history`}
                button={
                    <Toggle
                        id="show-project-conversations-toggle"
                        checked={showProjectConversationsInHistory}
                        onChange={() => {
                            updateSettings({
                                showProjectConversationsInHistory: !showProjectConversationsInHistory,
                                _autoSave: true,
                            });
                        }}
                    />
                }
            />

            {/* Automatic web search toggle */}
            {isLumoToolingEnabled && (
                <SettingsSectionItem
                    icon="globe"
                    text={c('collider_2025: Title').t`Automatic web search`}
                    subtext={c('collider_2025: Description').t`Always enable web search for new conversations`}
                    button={
                        <Toggle
                            id="automatic-web-search-toggle"
                            checked={automaticWebSearch}
                            onChange={() => {
                                updateSettings({
                                    automaticWebSearch: !automaticWebSearch,
                                    _autoSave: true,
                                });
                            }}
                        />
                    }
                />
            )}

            {/* Search Index Management */}
            <SettingsSectionItem
                icon="magnifier"
                text={c('collider_2025: Title').t`Search Index`}
                subtext={
                    <div className="flex flex-column gap-1">
                        <span className="color-weak">{c('collider_2025: Description')
                            .t`Encrypted search index for chats and Drive files.`}</span>

                        {showIndexingProgress && (
                            <IndexingStatusBanner
                                indexingStatus={driveIndexingStatus}
                                isIndexing={isDriveIndexing}
                                inline
                            />
                        )}
                        {hasError && (
                            <span className="color-danger text-sm">{indexError || messageIndexingStatus.error}</span>
                        )}
                    </div>
                }
                button={<SearchIndexManagement onReindex={handleReindex} disabled={isIndexing || isDriveIndexing} />}
            />

            <SettingsSectionItem
                icon="speech-bubble"
                text={c('collider_2025: Title').t`Delete everything`}
                subtext={c('collider_2025: Description')
                    .t`Permanently delete your project and chats. This is irreversible.`}
                button={<DeleteAllButton onClose={onClose} />}
            />
            <SettingsSectionItem
                icon="info-circle"
                text={c('collider_2025: Title').t`About ${LUMO_SHORT_APP_NAME}`}
                subtext={c('collider_2025: Description').jt`Last updated on ${formattedDate}`}
            />
        </div>
    );
};
const getPlanName = (hasLumoSeat: boolean, isVisionary: boolean, hasLumoB2B: boolean) => {
    if (hasLumoB2B) {
        return c('collider_2025: Title').t`${LUMO_SHORT_APP_NAME} Business`;
    }
    if (hasLumoSeat || isVisionary) {
        return c('collider_2025: Title').t`${LUMO_SHORT_APP_NAME} Plus`;
    }
    return;
};
const AccountSettingsPanel = () => {
    const [user] = useUser();
    const { hasLumoSeat, isVisionary, hasLumoB2B, hasLumoPlus } = useLumoPlan();
    const planName = getPlanName(hasLumoSeat, isVisionary, hasLumoB2B);

    return (
        <>
            <div className="flex flex-column flex-nowrap gap-4">
                <ButtonLike
                    as={SettingsLink}
                    path={''}
                    className="user-settings-card flex flex-row flex-nowrap gap-4 items-start p-4 rounded-lg bg-norm cursor-pointer text-left w-full"
                >
                    <Avatar className="shrink-0">{getInitials(user.DisplayName ?? user.Name)}</Avatar>
                    <div className="flex-1 flex flex-column gap-0 items-start">
                        <div className="flex flex-row items-center gap-3 mb-1">
                            <span className="text-bold text-lg color-norm">{user.DisplayName ?? user.Name}</span>
                            {planName && (
                                <span className="inline-flex items-center py-1 px-2 text-xs rounded-full plan-name">
                                    {planName}
                                </span>
                            )}

                            {isVisionary && (
                                <span className="inline-flex items-center py-1 px-2 text-xs rounded-full plan-name">
                                    {c('collider_2025: Title').t`Visionary`}
                                </span>
                            )}
                        </div>
                        <span className="color-weak text-sm text-left">{user.Email}</span>
                    </div>
                    <Icon name="chevron-right" className="color-weak shrink-0 mt-2" size={4} />
                </ButtonLike>
            </div>
            {hasLumoPlus ? <PaidSubscriptionPanel /> : <LumoSettingsPanelUpsell />}
        </>
    );
};

const AccountSettingsPanelGuest = () => {
    const createLink = <CreateFreeAccountLink key="create-free-account-link" />;
    return (
        <>
            <LumoSettingsPanelUpsell />
            <SettingsSectionItem
                icon="user"
                text={c('collider_2025: Title').t`Guest`}
                subtext={
                    // translator: createLink is a button Create a free account
                    c('collider_2025: Description')
                        .jt`Sign in to access your account and unlock more features. Don't have one? ${createLink}`
                }
                button={<SignInLinkButton color="weak" shape="outline" />}
            />
        </>
    );
};

interface SettingsModalProps extends ModalOwnProps {
    initialPanel?: string;
}

const SettingsModal = ({ initialPanel = 'account', ...modalProps }: SettingsModalProps) => {
    const [activePanel, setActivePanel] = useState(initialPanel);
    const isGuest = useIsGuest();
    const closeModal = modalProps.onClose;

    return (
        <ModalTwo size="xlarge" enableCloseWhenClickOutside className="lumo-settings-modal" {...modalProps}>
            <ModalTwoContent>
                {/* Close button in top-right corner */}
                <Button
                    icon
                    shape="ghost"
                    size="small"
                    onClick={closeModal}
                    title={c('Action').t`Close`}
                    className="modal-close-button"
                >
                    <Icon name="cross" size={6} />
                </Button>

                <div className="modal-main-container">
                    {/* Desktop view with sidebar */}
                    <div className="hidden md:flex md:flex-row flex-nowrap flex-1">
                        <div className="sidebar-container">
                            <LumoSettingsSidebar
                                activePanel={activePanel}
                                onPanelChange={setActivePanel}
                                isGuest={isGuest}
                            />
                        </div>

                        <div className="flex flex-column flex-nowrap flex-1 content-container">
                            {/* Top bar with panel name only */}
                            <div className="flex items-center top-bar">
                                <h2 className="text-xl text-semibold m-0">
                                    {SettingsItems.find((item) => item.id === activePanel)?.getText() || 'Settings'}
                                </h2>
                            </div>

                            {/* Panel content */}
                            <div className="flex flex-row gap-2 flex-1 overflow-y-auto mb-10" style={{ minHeight: 0 }}>
                                {activePanel === 'account' &&
                                    (isGuest ? <AccountSettingsPanelGuest /> : <AccountSettingsPanel />)}
                                {activePanel === 'personalization' && <PersonalizationPanel />}
                                {activePanel === 'general' &&
                                    (isGuest ? (
                                        <GeneralSettingsPanelGuest />
                                    ) : (
                                        <GeneralSettingsPanelAuth onClose={closeModal} />
                                    ))}
                            </div>
                        </div>
                    </div>

                    {/* Mobile view with tabs */}
                    <div className="md:hidden flex flex-column flex-1">
                        {/* Settings title */}
                        <div className="mobile-section-header">
                            <h1 className="text-2xl text-bold m-0">Settings</h1>
                        </div>

                        {/* Mobile tabs */}
                        <div className="mobile-tabs-container">
                            <div className="mobile-tabs">
                                {SettingsItems.map((item) => (
                                    <Button
                                        key={item.id}
                                        shape="ghost"
                                        className={clsx('mobile-tab', activePanel === item.id && 'mobile-tab-active')}
                                        onClick={() => setActivePanel(item.id)}
                                        disabled={isGuest && !item.guest}
                                        aria-pressed={activePanel === item.id}
                                    >
                                        <Icon className="shrink-0" name={item.icon} size={4} />
                                        <span className="text-sm">{item.getText()}</span>
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Tab content */}
                        <div className="mobile-tab-content flex flex-column flex-1">
                            {activePanel === 'account' &&
                                (isGuest ? <AccountSettingsPanelGuest /> : <AccountSettingsPanel />)}
                            {activePanel === 'personalization' && <PersonalizationPanel />}
                            {activePanel === 'general' &&
                                (isGuest ? (
                                    <GeneralSettingsPanelGuest />
                                ) : (
                                    <GeneralSettingsPanelAuth onClose={closeModal} />
                                ))}
                        </div>
                    </div>
                </div>
            </ModalTwoContent>
        </ModalTwo>
    );
};

export default SettingsModal;
