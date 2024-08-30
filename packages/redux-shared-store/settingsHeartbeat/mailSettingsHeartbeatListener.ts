import type { TypedStartListening } from '@reduxjs/toolkit';
import type { ProtonDispatch, ProtonThunkArguments } from 'packages/redux-shared-store-types';

import { addressesThunk, subscriptionThunk, userSettingsThunk, userThunk } from '@proton/account';
import { bootstrapEvent } from '@proton/account/bootstrap/action';
import { categoriesThunk, mailSettingsThunk } from '@proton/mail';
import { TelemetryMailHeartbeatEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { LABEL_TYPE } from '@proton/shared/lib/constants';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
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

import {
    formatBooleanForHeartbeat,
    getDefaultDimensions,
    saveHeartbeatTimestamp,
    shouldSendHeartBeat,
} from './heartbeatHelper';
import type { RequiredState } from './interface';
import {
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

            void sendTelemetryReport({
                api: listenerApi.extra.api,
                measurementGroup: TelemetryMeasurementGroups.settingsHeartBeat,
                event: TelemetryMailHeartbeatEvents.mail_heartbeat,
                dimensions: {
                    ...getDefaultDimensions({ user, userSettings, subscription }),
                    sign: formatBooleanForHeartbeat(mailSettings.Sign),
                    key_transparency: formatBooleanForHeartbeat(mailSettings.KT),
                    shortcuts: formatBooleanForHeartbeat(mailSettings.Shortcuts),
                    prompt_pin: formatBooleanForHeartbeat(mailSettings.PromptPin),
                    pm_signature: formatBooleanForHeartbeat(mailSettings.PMSignature),
                    sticky_labels: formatBooleanForHeartbeat(mailSettings.StickyLabels),
                    unread_favicon: formatBooleanForHeartbeat(mailSettings.UnreadFavicon),
                    almost_all_mail: formatBooleanForHeartbeat(mailSettings.AlmostAllMail),
                    folder_colors: formatBooleanForHeartbeat(mailSettings.EnableFolderColor),
                    attach_public_key: formatBooleanForHeartbeat(mailSettings.AttachPublicKey),
                    auto_save_contacts: formatBooleanForHeartbeat(mailSettings.AutoSaveContacts),
                    remove_image_metadata: formatBooleanForHeartbeat(mailSettings.RemoveImageMetadata),
                    pm_signature_referral: formatBooleanForHeartbeat(mailSettings.PMSignatureReferralLink),
                    inherit_parent_folder_color: formatBooleanForHeartbeat(mailSettings.InheritParentFolderColor),
                    labels_count: getArrayLengthRange(labels),
                    folders_count: getArrayLengthRange(folders),
                    address_count: getAddressRange(addresses),
                    page_size: getPageSize(mailSettings.PageSize),
                    font_face: getFontFace(mailSettings.FontFace),
                    font_size: getFontSize(mailSettings.FontSize),
                    image_proxy: imageProxy(mailSettings.ImageProxy),
                    pgp_scheme: getPGPScheme(mailSettings.PGPScheme),
                    swipe_left: getSwipeAction(mailSettings.SwipeLeft),
                    swipe_right: getSwipeAction(mailSettings.SwipeRight),
                    delay_send_seconds: getDelaySecond(mailSettings.DelaySendSeconds),
                    next_message_on_move: getNextMessageOnMove(mailSettings.NextMessageOnMove),
                    view_mode: mailSettings.ViewMode === VIEW_MODE.GROUP ? 'group' : 'single',
                    view_layout: mailSettings.ViewLayout === VIEW_LAYOUT.ROW ? 'row' : 'colum',
                    confirm_link: mailSettings.ConfirmLink === CONFIRM_LINK.CONFIRM ? 'true' : 'false',
                    right_to_left: mailSettings.RightToLeft === DIRECTION.RIGHT_TO_LEFT ? 'true' : 'false',
                    hide_remote_images: mailSettings.HideRemoteImages === SHOW_IMAGES.HIDE ? 'hide' : 'show',
                    hide_embeed_images: mailSettings.HideEmbeddedImages === SHOW_IMAGES.HIDE ? 'hide' : 'show',
                    composer_mode: mailSettings.ComposerMode === COMPOSER_MODE.MAXIMIZED ? 'maximized' : 'popup',
                    hide_sender_image: mailSettings.HideSenderImages === HIDE_SENDER_IMAGES.HIDE ? 'true' : 'false',
                    spam_action: mailSettings.SpamAction === SPAM_ACTION.JustSpam ? 'just-spam' : 'spam-and-unsub',
                    message_button:
                        mailSettings.MessageButtons === MESSAGE_BUTTONS.READ_UNREAD ? 'read-unread' : 'unread-read',
                    autodelete_trash_days:
                        mailSettings.AutoDeleteSpamAndTrashDays === AUTO_DELETE_SPAM_AND_TRASH_DAYS.ACTIVE
                            ? 'true'
                            : 'false',
                },
            });

            saveHeartbeatTimestamp(mailHeartbeatKey);
        },
    });
};
