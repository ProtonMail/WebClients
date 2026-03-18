import { c } from 'ttag';

import { isCustomFolder } from '@proton/mail/helpers/location';
import type { TelemetryMailSelectAllEvents } from '@proton/shared/lib/api/telemetry';
import { TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import type { Api } from '@proton/shared/lib/interfaces';
import type { Folder } from '@proton/shared/lib/interfaces/Folder';

export const getNotificationTextUnauthorized = (folderID?: string, fromLabelID?: string) => {
    let notificationText = c('Error display when performing invalid move on message')
        .t`This action cannot be performed`;

    if (fromLabelID === MAILBOX_LABEL_IDS.SENT || fromLabelID === MAILBOX_LABEL_IDS.ALL_SENT) {
        if (folderID === MAILBOX_LABEL_IDS.INBOX) {
            notificationText = c('Error display when performing invalid move on message')
                .t`Sent messages cannot be moved to Inbox`;
        } else if (folderID === MAILBOX_LABEL_IDS.SPAM) {
            notificationText = c('Error display when performing invalid move on message')
                .t`Sent messages cannot be moved to Spam`;
        }
    } else if (fromLabelID === MAILBOX_LABEL_IDS.DRAFTS || fromLabelID === MAILBOX_LABEL_IDS.ALL_DRAFTS) {
        if (folderID === MAILBOX_LABEL_IDS.INBOX) {
            notificationText = c('Error display when performing invalid move on message')
                .t`Drafts cannot be moved to Inbox`;
        } else if (folderID === MAILBOX_LABEL_IDS.SPAM) {
            notificationText = c('Error display when performing invalid move on message')
                .t`Drafts cannot be moved to Spam`;
        }
    }
    return notificationText;
};

// Return the labelID if the folder is a system folder, 'custom_folder' otherwise
export const getCleanedFolderID = (labelID: string, folders: Folder[]) => {
    return isCustomFolder(labelID, folders) ? 'custom_folder' : labelID;
};

export const sendSelectAllTelemetryReport = async ({
    api,
    sourceLabelID,
    event,
}: {
    api: Api;
    sourceLabelID: string;
    event: TelemetryMailSelectAllEvents;
}) => {
    void sendTelemetryReport({
        api: api,
        measurementGroup: TelemetryMeasurementGroups.mailSelectAll,
        event,
        dimensions: {
            sourceLabelID,
        },
        delay: false,
    });
};
