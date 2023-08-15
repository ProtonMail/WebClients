import { useMemo } from 'react';

import { c } from 'ttag';

import { Icon, IconName, Info, Option, SelectTwo, Tooltip, useModalState } from '@proton/components/components';
import {
    DefaultQuickSettings,
    QuickSettingsButton,
    QuickSettingsButtonSection,
    QuickSettingsMain,
    QuickSettingsSection,
    QuickSettingsSectionRow,
} from '@proton/components/components/drawer/views/quickSettings';
import DrawerAllSettingsView from '@proton/components/components/drawer/views/quickSettings/DrawerAllSettingsView';
import { KeyTransparencyDetailsModal } from '@proton/components/components/keyTransparency';
import { MailShortcutsModal, useKeyTransparencyContext } from '@proton/components/containers';
import ShortcutsToggle from '@proton/components/containers/general/ShortcutsToggle';
import { useApi, useEventManager, useMailSettings, useNotifications, useUserSettings } from '@proton/components/hooks';
import useKeyTransparencyNotification from '@proton/components/hooks/useKeyTransparencyNotification';
import { useLoading } from '@proton/hooks';
import { updateComposerMode, updateViewLayout } from '@proton/shared/lib/api/mailSettings';
import { updateDensity } from '@proton/shared/lib/api/settings';
import { COMPOSER_MODE, DENSITY, MAIL_APP_NAME, VIEW_LAYOUT } from '@proton/shared/lib/constants';
import { KEY_TRANSPARENCY_REMINDER_UPDATE, QuickSettingsReminders } from '@proton/shared/lib/drawer/interfaces';
import { isFirefox } from '@proton/shared/lib/helpers/browser';
import { KeyTransparencyActivation } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import OnboardingChecklistModal from 'proton-mail/components/header/OnboardingChecklistModal';
import { useGetStartedChecklist } from 'proton-mail/containers/onboardingChecklist/provider/GetStartedChecklistProvider';

import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import ClearBrowserDataModal from '../header/ClearBrowserDataModal';
import MailDefaultHandlerModal from '../header/MailDefaultHandlerModal';

interface QuickSettingsSelectOption {
    value: any;
    text: string;
    icon?: IconName;
}

const MailQuickSettings = () => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();

    const [{ Density, Checklists }] = useUserSettings();
    const [{ ComposerMode, ViewLayout } = { ComposerMode: 0, ViewLayout: 0 }] = useMailSettings();
    const { getESDBStatus } = useEncryptedSearchContext();
    const { dbExists, esEnabled } = getESDBStatus();

    const keyTransparencyNotification = useKeyTransparencyNotification();
    const { ktActivation } = useKeyTransparencyContext();
    const showKT = ktActivation === KeyTransparencyActivation.SHOW_UI;

    const hasFreeOnboardingChecklist = Checklists?.includes('get-started');
    const { isChecklistFinished } = useGetStartedChecklist();

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

    return (
        <QuickSettingsMain>
            <DrawerAllSettingsView />

            <QuickSettingsSection>
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
                                        className="flex flex-align-items-center flex-nowrap gap-2 flex-item-noshrink"
                                    >
                                        <>
                                            {option.icon && <Icon name={option.icon} className="flex-item-noshrink" />}
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
                                        className="flex flex-align-items-center flex-nowrap gap-2 flex-item-noshrink"
                                    >
                                        <>
                                            {option.icon && <Icon name={option.icon} className="flex-item-noshrink" />}
                                            <span className="flex-item-noshrink">{option.text}</span>
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
                                        className="flex flex-align-items-center flex-nowrap gap-2 flex-item-noshrink"
                                    >
                                        <>
                                            {option.icon && <Icon name={option.icon} className="flex-item-noshrink" />}
                                            <span className="text-nowrap flex-item-noshrink">{option.text}</span>
                                        </>
                                    </Option>
                                );
                            })}
                        </SelectTwo>
                    }
                />
            </QuickSettingsSection>

            <QuickSettingsSection>
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
            </QuickSettingsSection>

            <DefaultQuickSettings inAppReminders={mailReminders} />

            <QuickSettingsButtonSection>
                {hasFreeOnboardingChecklist && (
                    <QuickSettingsButton
                        onClick={() => setOnboardingChecklistProps(true)}
                        data-testid="mail-quick-settings:started-checklist-button"
                    >
                        {isChecklistFinished
                            ? c('Get started checklist instructions').t`Open checklist`
                            : c('Get started checklist instructions').t`Open checklist and get free storage`}
                    </QuickSettingsButton>
                )}

                {isFirefox() && (
                    <QuickSettingsButton
                        onClick={() => setDefaultHandlerModalOpen(true)}
                        data-testid="mail-quick-settings:default-mail-app-button"
                    >
                        {c('Action').t`Set ${MAIL_APP_NAME} as default email application`}
                    </QuickSettingsButton>
                )}

                {(dbExists || esEnabled) && (
                    <>
                        <Tooltip
                            title={c('Info')
                                .t`Clears browser data related to message content search including downloaded messages`}
                        >
                            <QuickSettingsButton
                                onClick={() => setClearBrowserDataModalOpen(true)}
                                data-testid="mail-quick-settings:clear-cache-button"
                            >
                                {c('Action').t`Clear browser data`}
                            </QuickSettingsButton>
                        </Tooltip>
                    </>
                )}
            </QuickSettingsButtonSection>

            <MailDefaultHandlerModal {...mailDefaultHandlerProps} />
            <ClearBrowserDataModal {...clearBrowserDataProps} />
            <MailShortcutsModal {...mailShortcutsProps} />
            <KeyTransparencyDetailsModal {...keyTransparencyDetailsModalProps} />
            <OnboardingChecklistModal {...onboardingChecklistProps} />
        </QuickSettingsMain>
    );
};

export default MailQuickSettings;
