import type { TypedStartListening } from '@reduxjs/toolkit';

import { addressesThunk, subscriptionThunk, userSettingsThunk, userThunk } from '@proton/account';
import { bootstrapEvent } from '@proton/account/bootstrap/action';
import { categoriesThunk } from '@proton/mail/store/labels';
import { mailSettingsThunk } from '@proton/mail/store/mailSettings';
import type { ProtonDispatch, ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { TelemetryHeartbeatEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { LABEL_TYPE } from '@proton/shared/lib/constants';
import { sendTelemetryReportWithBaseDimensions } from '@proton/shared/lib/helpers/metrics';
import {
    AUTO_DELETE_SPAM_AND_TRASH_DAYS,
    COMPOSER_MODE,
    CONFIRM_LINK,
    DIRECTION,
    HIDE_SENDER_IMAGES,
    MESSAGE_BUTTONS,
    SHOW_IMAGES,
    SPAM_ACTION,
    VIEW_LAYOUT,
    VIEW_MODE,
} from '@proton/shared/lib/mail/mailSettings';
import { PROTON_DEFAULT_THEME_SETTINGS, PROTON_THEMES_MAP } from '@proton/shared/lib/themes/themes';

import {
    formatBooleanForHeartbeat,
    getThemeMode,
    saveHeartbeatTimestamp,
    shouldSendHeartBeat,
} from './heartbeatHelper';
import type { RequiredState } from './interface';
import {
    formatShowMoved,
    getAddressRange,
    getArrayLengthRange,
    getDelaySecond,
    getFontFace,
    getFontSize,
    getNextMessageOnMove,
    getPGPScheme,
    getPageSize,
    getSwipeAction,
    imageProxy,
} from './mailHeartbeatHelper';

type AppStartListening = TypedStartListening<RequiredState, ProtonDispatch<any>, ProtonThunkArguments>;

const mailHeartbeatKey = 'mail-heartbeat-timestamp' as const;
export const mailSettingsHeartbeatListener = (startListening: AppStartListening) => {
    startListening({
        actionCreator: bootstrapEvent,
        effect: async (_, listenerApi) => {
            if (!shouldSendHeartBeat(mailHeartbeatKey)) {
                return;
            }

            const [mailSettings, addresses, categories, user, userSettings, subscription] = await Promise.all([
                listenerApi.dispatch(mailSettingsThunk()),
                listenerApi.dispatch(addressesThunk()),
                listenerApi.dispatch(categoriesThunk()),
                listenerApi.dispatch(userThunk()),
                listenerApi.dispatch(userSettingsThunk()),
                listenerApi.dispatch(subscriptionThunk()),
            ]);

            const folders = categories.filter((category) => category.Type === LABEL_TYPE.MESSAGE_FOLDER);
            const labels = categories.filter((category) => category.Type === LABEL_TYPE.MESSAGE_LABEL);

            const { DarkTheme, LightTheme, Mode } = userSettings.Theme || PROTON_DEFAULT_THEME_SETTINGS;

            void sendTelemetryReportWithBaseDimensions({
                user,
                subscription,
                userSettings,
                api: listenerApi.extra.api,
                measurementGroup: TelemetryMeasurementGroups.settingsHeartBeat,
                event: TelemetryHeartbeatEvents.mail_heartbeat,
                dimensions: {
                    lightThemeName: PROTON_THEMES_MAP[LightTheme].label,
                    darkThemeName: PROTON_THEMES_MAP[DarkTheme].label,
                    themeMode: getThemeMode(Mode),
                    sign: formatBooleanForHeartbeat(mailSettings.Sign),
                    keyTransparency: formatBooleanForHeartbeat(mailSettings.KT),
                    shortcuts: formatBooleanForHeartbeat(mailSettings.Shortcuts),
                    promptPin: formatBooleanForHeartbeat(mailSettings.PromptPin),
                    pmSignature: formatBooleanForHeartbeat(mailSettings.PMSignature),
                    stickyLabels: formatBooleanForHeartbeat(mailSettings.StickyLabels),
                    unreadFavicon: formatBooleanForHeartbeat(mailSettings.UnreadFavicon),
                    almostAllMail: formatBooleanForHeartbeat(mailSettings.AlmostAllMail),
                    folderColors: formatBooleanForHeartbeat(mailSettings.EnableFolderColor),
                    attachPublicKey: formatBooleanForHeartbeat(mailSettings.AttachPublicKey),
                    autoSaveContacts: formatBooleanForHeartbeat(mailSettings.AutoSaveContacts),
                    removeImageMetadata: formatBooleanForHeartbeat(mailSettings.RemoveImageMetadata),
                    pmSignatureReferral: formatBooleanForHeartbeat(mailSettings.PMSignatureReferralLink),
                    inheritParentFolderColor: formatBooleanForHeartbeat(mailSettings.InheritParentFolderColor),
                    categoryView: formatBooleanForHeartbeat(mailSettings.MailCategoryView),
                    showMoved: formatShowMoved(mailSettings.ShowMoved),
                    labelsCount: getArrayLengthRange(labels),
                    foldersCount: getArrayLengthRange(folders),
                    addressCount: getAddressRange(addresses),
                    pageSize: getPageSize(mailSettings.PageSize),
                    fontFace: getFontFace(mailSettings.FontFace),
                    fontSize: getFontSize(mailSettings.FontSize),
                    imageProxy: imageProxy(mailSettings.ImageProxy),
                    pgpScheme: getPGPScheme(mailSettings.PGPScheme),
                    swipeLeft: getSwipeAction(mailSettings.SwipeLeft),
                    swipeRight: getSwipeAction(mailSettings.SwipeRight),
                    delaySendSeconds: getDelaySecond(mailSettings.DelaySendSeconds),
                    nextMessageOnMove: getNextMessageOnMove(mailSettings.NextMessageOnMove),
                    viewMode: mailSettings.ViewMode === VIEW_MODE.GROUP ? 'group' : 'single',
                    viewLayout: mailSettings.ViewLayout === VIEW_LAYOUT.ROW ? 'row' : 'colum',
                    confirmLink: mailSettings.ConfirmLink === CONFIRM_LINK.CONFIRM ? 'true' : 'false',
                    rightToLeft: mailSettings.RightToLeft === DIRECTION.RIGHT_TO_LEFT ? 'true' : 'false',
                    hideRemoteImages: mailSettings.HideRemoteImages === SHOW_IMAGES.HIDE ? 'hide' : 'show',
                    hideEmbeedImages: mailSettings.HideEmbeddedImages === SHOW_IMAGES.HIDE ? 'hide' : 'show',
                    composerMode: mailSettings.ComposerMode === COMPOSER_MODE.MAXIMIZED ? 'maximized' : 'popup',
                    hideSenderImage: mailSettings.HideSenderImages === HIDE_SENDER_IMAGES.HIDE ? 'true' : 'false',
                    spamAction: mailSettings.SpamAction === SPAM_ACTION.JustSpam ? 'just-spam' : 'spam-and-unsub',
                    messageButton:
                        mailSettings.MessageButtons === MESSAGE_BUTTONS.READ_UNREAD ? 'read-unread' : 'unread-read',
                    autodeleteTrashDays:
                        mailSettings.AutoDeleteSpamAndTrashDays === AUTO_DELETE_SPAM_AND_TRASH_DAYS.ACTIVE
                            ? 'true'
                            : 'false',
                },
                delay: false,
            });

            saveHeartbeatTimestamp(mailHeartbeatKey);
        },
    });
};
