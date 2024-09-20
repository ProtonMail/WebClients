import { useMemo } from 'react';

import { c } from 'ttag';

import type { IconName } from '@proton/components';
import {
    Icon,
    Info,
    MailShortcutsModal,
    Option,
    SelectTwo,
    ShortcutsToggle,
    ToggleAssistant,
    ToggleAssistantEnvironment,
    Tooltip,
    useKeyTransparencyContext,
    useModalState,
} from '@proton/components';
import {
    DefaultQuickSettings,
    QuickSettingsButton,
    QuickSettingsButtonSection,
    QuickSettingsSectionRow,
} from '@proton/components/components/drawer/views/quickSettings';
import DrawerAllSettingsView from '@proton/components/components/drawer/views/quickSettings/DrawerAllSettingsView';
import DrawerDownloadApps from '@proton/components/components/drawer/views/quickSettings/DrawerDownloadApps';
import { DrawerAppScrollContainer, DrawerAppSection } from '@proton/components/components/drawer/views/shared';
import { KeyTransparencyDetailsModal } from '@proton/components/components/keyTransparency';
import { useApi, useEventManager, useNotifications, useUserSettings } from '@proton/components/hooks';
import useAssistantFeatureEnabled from '@proton/components/hooks/assistant/useAssistantFeatureEnabled';
import useKeyTransparencyNotification from '@proton/components/hooks/useKeyTransparencyNotification';
import { useLoading } from '@proton/hooks';
import { useAssistant } from '@proton/llm/lib';
import { updateComposerMode, updateViewLayout } from '@proton/shared/lib/api/mailSettings';
import { updateDensity } from '@proton/shared/lib/api/settings';
import { DENSITY, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import type { QuickSettingsReminders } from '@proton/shared/lib/drawer/interfaces';
import { KEY_TRANSPARENCY_REMINDER_UPDATE } from '@proton/shared/lib/drawer/interfaces';
import { isChromiumBased, isFirefox, openNewTab } from '@proton/shared/lib/helpers/browser';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { AI_ASSISTANT_ACCESS, KeyTransparencyActivation } from '@proton/shared/lib/interfaces';
import { COMPOSER_MODE, VIEW_LAYOUT } from '@proton/shared/lib/mail/mailSettings';
import isTruthy from '@proton/utils/isTruthy';

import OnboardingChecklistModal from 'proton-mail/components/header/OnboardingChecklistModal';
import { useGetStartedChecklist } from 'proton-mail/containers/onboardingChecklist/provider/GetStartedChecklistProvider';
import useMailModel from 'proton-mail/hooks/useMailModel';

import ClearBrowserDataModal from '../header/ClearBrowserDataModal';
import MailDefaultHandlerModal from '../header/MailDefaultHandlerModal';

const { OFF, UNSET, SERVER_ONLY } = AI_ASSISTANT_ACCESS;

interface QuickSettingsSelectOption {
    value: any;
    text: string;
    icon?: IconName;
}

const MailQuickSettings = () => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();

    const [{ Density, AIAssistantFlags }] = useUserSettings();
    const { ComposerMode, ViewLayout } = useMailModel('MailSettings');
    const {
        openedAssistants,
        resetAssistantState,
        closeAssistant,
        handleSettingChange,
        handleCheckHardwareCompatibility,
    } = useAssistant();

    const assistantFeatureEnabled = useAssistantFeatureEnabled();

    const keyTransparencyNotification = useKeyTransparencyNotification();
    const { ktActivation } = useKeyTransparencyContext();
    const showKT = ktActivation === KeyTransparencyActivation.SHOW_UI;

    // TODO remove once the extended checklist storage split is
    const { isChecklistFinished, canDisplayChecklist } = useGetStartedChecklist();

    const [loadingViewLayout, withLoadingViewLayout] = useLoading();
    const [loadingDensity, withLoadingDensity] = useLoading();
    const [loadingComposerSize, withLoadingComposerSize] = useLoading();

    const [clearBrowserDataProps, setClearBrowserDataModalOpen] = useModalState();
    const [mailDefaultHandlerProps, setDefaultHandlerModalOpen] = useModalState();
    const [mailShortcutsProps, setMailShortcutsModalOpen] = useModalState();
    const [keyTransparencyDetailsModalProps, setKeyTransparencyDetailsModalOpen] = useModalState();
    const [onboardingChecklistProps, setOnboardingChecklistProps] = useModalState();

    const viewLayoutOptions: QuickSettingsSelectOption[] = [
        {
            icon: 'column-two',
            value: VIEW_LAYOUT.COLUMN,
            text: c('Layout mode').t`Column`,
        },
        {
            icon: 'column-one',
            value: VIEW_LAYOUT.ROW,
            text: c('Layout mode').t`Row`,
        },
    ];
    const defaultViewLayoutOption =
        viewLayoutOptions.find((option) => option.value === ViewLayout) || viewLayoutOptions[0];

    const densityOptions: QuickSettingsSelectOption[] = [
        {
            icon: 'density-low',
            value: DENSITY.COMFORTABLE,
            text: c('Density mode').t`Comfortable`,
        },
        {
            icon: 'density-high',
            value: DENSITY.COMPACT,
            text: c('Density mode').t`Compact`,
        },
    ];
    const defaultDensityOption = densityOptions.find((option) => option.value === Density) || densityOptions[0];

    const composerSizeOptions: QuickSettingsSelectOption[] = [
        {
            icon: 'window-small',
            value: COMPOSER_MODE.POPUP,
            text: c('Composer size').t`Normal`,
        },
        {
            icon: 'window-maximised',
            value: COMPOSER_MODE.MAXIMIZED,
            text: c('Composer size').t`Maximized`,
        },
    ];
    const defaultComposerModeOption =
        composerSizeOptions.find((option) => option.value === ComposerMode) || composerSizeOptions[0];

    const handleChangeViewLayout = async (layout: number) => {
        await api(updateViewLayout(layout));
        await call();
        createNotification({ text: c('Success').t`Preference saved` });
    };

    const handleChangeDensity = async (density: number) => {
        await api(updateDensity(density));
        await call();
        createNotification({ text: c('Success').t`Preference saved` });
    };

    const handleChangeComposerMode = async (mode: number) => {
        await api(updateComposerMode(mode));
        await call();
        createNotification({ text: c('Success').t`Preference saved` });
    };

    const handleShowKeyTransparencyModal = () => {
        // Update local storage value
        document.dispatchEvent(
            new CustomEvent(KEY_TRANSPARENCY_REMINDER_UPDATE, {
                detail: {
                    value: true,
                },
            })
        );

        setKeyTransparencyDetailsModalOpen(true);
    };

    const mailReminders: QuickSettingsReminders[] = useMemo(() => {
        const ktReminder: QuickSettingsReminders | undefined = showKT
            ? {
                  color: keyTransparencyNotification,
                  icon: keyTransparencyNotification ? 'exclamation-circle-filled' : undefined,
                  text: c('loc_nightly: Key transparency details').t`Key verification`,
                  callback: handleShowKeyTransparencyModal,
                  testID: 'key-verification',
              }
            : undefined;

        return [ktReminder].filter(isTruthy);
    }, [showKT, keyTransparencyNotification]);

    const handleDisableAssistant = () => {
        for (const { id: otherComposerID } of openedAssistants) {
            closeAssistant(otherComposerID, true);
        }
        resetAssistantState();
    };

    const handleEnableAssistantLocal = async () => {
        const { hasCompatibleHardware, hasCompatibleBrowser } = await handleCheckHardwareCompatibility();
        // If more than one assistant, we want to close them all when switching to local mode,
        // otherwise users will get several assistant opened at the same time and we still don't have a queue mechanism
        if (!hasCompatibleBrowser || !hasCompatibleHardware || openedAssistants.length > 1) {
            for (const { id: otherComposerID } of openedAssistants) {
                closeAssistant(otherComposerID, true);
            }
        } else {
            handleSettingChange?.();
        }
    };

    const aiFlag = AIAssistantFlags === UNSET ? SERVER_ONLY : AIAssistantFlags;

    return (
        <DrawerAppScrollContainer>
            <DrawerAllSettingsView />
            <DrawerDownloadApps />

            <DrawerAppSection>
                <QuickSettingsSectionRow
                    // translator: As in Mailbox layout
                    label={c('Label').t`Layout`}
                    action={
                        <SelectTwo
                            unstyled
                            originalPlacement="bottom-end"
                            value={defaultViewLayoutOption.value}
                            onValue={(value: number) => withLoadingViewLayout(handleChangeViewLayout(value))}
                            renderSelected={(selected) => {
                                const value = viewLayoutOptions.find((option) => option.value === selected);
                                return <>{value?.text}</>;
                            }}
                            disabled={loadingViewLayout}
                            loading={loadingViewLayout}
                            data-testid="mail-quick-settings:mailbox-layout-select"
                        >
                            {viewLayoutOptions.map((option) => {
                                return (
                                    <Option
                                        key={option.value}
                                        value={option.value}
                                        title={option.text}
                                        className="flex items-center flex-nowrap gap-2 shrink-0"
                                    >
                                        <>
                                            {option.icon && <Icon name={option.icon} className="shrink-0" />}
                                            <span className="text-nowrap">{option.text}</span>
                                        </>
                                    </Option>
                                );
                            })}
                        </SelectTwo>
                    }
                />

                <QuickSettingsSectionRow
                    // translator: As in Mailbox layout
                    label={c('Label').t`Density`}
                    action={
                        <SelectTwo
                            unstyled
                            originalPlacement="bottom-end"
                            value={defaultDensityOption.value}
                            onValue={(value: number) => withLoadingDensity(handleChangeDensity(value))}
                            renderSelected={(selected) => {
                                const value = densityOptions.find((option) => option.value === selected);
                                return <>{value?.text}</>;
                            }}
                            disabled={loadingDensity}
                            loading={loadingDensity}
                            data-testid="mail-quick-settings:mailbox-density-select"
                        >
                            {densityOptions.map((option) => {
                                return (
                                    <Option
                                        key={option.value}
                                        value={option.value}
                                        title={option.text}
                                        className="flex items-center flex-nowrap gap-2 shrink-0"
                                    >
                                        <>
                                            {option.icon && <Icon name={option.icon} className="shrink-0" />}
                                            <span className="shrink-0">{option.text}</span>
                                        </>
                                    </Option>
                                );
                            })}
                        </SelectTwo>
                    }
                />

                <QuickSettingsSectionRow
                    // translator: As in Composer size
                    label={c('Label').t`Composer`}
                    action={
                        <SelectTwo
                            unstyled
                            originalPlacement="bottom-end"
                            value={defaultComposerModeOption.value}
                            onValue={(value: number) => withLoadingComposerSize(handleChangeComposerMode(value))}
                            renderSelected={(selected) => {
                                const value = composerSizeOptions.find((option) => option.value === selected);
                                return <>{value?.text}</>;
                            }}
                            disabled={loadingComposerSize}
                            loading={loadingComposerSize}
                            data-testid="mail-quick-settings:composer-size-select"
                        >
                            {composerSizeOptions.map((option) => {
                                return (
                                    <Option
                                        key={option.value}
                                        value={option.value}
                                        title={option.text}
                                        className="flex items-center flex-nowrap gap-2 shrink-0"
                                    >
                                        <>
                                            {option.icon && <Icon name={option.icon} className="shrink-0" />}
                                            <span className="text-nowrap shrink-0">{option.text}</span>
                                        </>
                                    </Option>
                                );
                            })}
                        </SelectTwo>
                    }
                />
            </DrawerAppSection>

            <DrawerAppSection>
                <QuickSettingsSectionRow
                    label={c('Label').t`Keyboard shortcuts`}
                    labelInfo={
                        <Info
                            title={c('Info').t`Open shortcut cheat sheet`}
                            onClick={() => setMailShortcutsModalOpen(true)}
                            data-testid="mail-quick-settings:keyboard-shortcuts-info"
                        />
                    }
                    action={
                        <ShortcutsToggle
                            id="toggle-shortcuts"
                            data-testid="mail-quick-settings:keyboard-shortcuts-toggle"
                        />
                    }
                />
            </DrawerAppSection>

            {assistantFeatureEnabled.enabled && (
                <DrawerAppSection>
                    <QuickSettingsSectionRow
                        label={c('Label').t`Writing assistant`}
                        labelInfo={
                            aiFlag === OFF ? (
                                <Info
                                    title={c('Info').t`Learn more`}
                                    onClick={() => openNewTab(getKnowledgeBaseUrl('/proton-scribe-writing-assistant'))}
                                />
                            ) : undefined
                        }
                        action={
                            <ToggleAssistant
                                id="assistantSelect"
                                aiFlag={aiFlag}
                                onDisableSetting={handleDisableAssistant}
                            />
                        }
                    />
                    {/* Need to use handleSettingChange because at this stage we're still on the server mode, so we need to start the local init process*/}
                    {aiFlag !== OFF && (
                        <ToggleAssistantEnvironment
                            aiFlag={AIAssistantFlags}
                            onEnableLocal={handleEnableAssistantLocal}
                            onEnableServer={resetAssistantState}
                        />
                    )}
                </DrawerAppSection>
            )}

            <DefaultQuickSettings inAppReminders={mailReminders} />

            <QuickSettingsButtonSection>
                {canDisplayChecklist && (
                    <QuickSettingsButton
                        onClick={() => setOnboardingChecklistProps(true)}
                        data-testid="mail-quick-settings:started-checklist-button"
                    >
                        {isChecklistFinished
                            ? c('Get started checklist instructions').t`Open checklist`
                            : c('Get started checklist instructions').t`Open checklist and get free storage`}
                    </QuickSettingsButton>
                )}

                {!isElectronMail && (isFirefox() || isChromiumBased()) && (
                    <QuickSettingsButton
                        onClick={() => setDefaultHandlerModalOpen(true)}
                        data-testid="mail-quick-settings:default-mail-app-button"
                    >
                        {c('Action').t`Set ${MAIL_APP_NAME} as default email application`}
                    </QuickSettingsButton>
                )}

                <Tooltip
                    title={
                        isElectronMail
                            ? c('Info').t`Removes all data associated with this app (including downloaded messages, …)`
                            : c('Info').t`Clears browser data (including downloaded messages, …)`
                    }
                >
                    <QuickSettingsButton
                        onClick={() => setClearBrowserDataModalOpen(true)}
                        data-testid="mail-quick-settings:clear-cache-button"
                    >
                        {isElectronMail ? c('Action').t`Clear application data` : c('Action').t`Clear browser data`}
                    </QuickSettingsButton>
                </Tooltip>
            </QuickSettingsButtonSection>

            <MailDefaultHandlerModal {...mailDefaultHandlerProps} />
            <ClearBrowserDataModal {...clearBrowserDataProps} />
            <MailShortcutsModal {...mailShortcutsProps} />
            <KeyTransparencyDetailsModal {...keyTransparencyDetailsModalProps} />
            <OnboardingChecklistModal {...onboardingChecklistProps} />
        </DrawerAppScrollContainer>
    );
};

export default MailQuickSettings;
