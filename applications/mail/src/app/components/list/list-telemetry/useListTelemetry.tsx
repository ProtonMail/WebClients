import useApi from '@proton/components/hooks/useApi';
import { useFolders, useLabels } from '@proton/mail/store/labels/hooks';
import { TelemetryMailListEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import { traceInitiativeError } from '@proton/shared/lib/helpers/sentry';
import { useFlag } from '@proton/unleash';

import { useMailSelector } from 'proton-mail/store/hooks';

import { folderLocation } from './listTelemetryHelper';

export const enum ACTION_TYPE {
    MARK_AS_READ = 'MARK_AS_READ',
    MARK_AS_UNREAD = 'MARK_AS_UNREAD',
    DELETE_PERMANENTLY = 'DELETE_PERMANENTLY',
    SNOOZE = 'SNOOZE',
    UNSNOOZE = 'UNSNOOZE',
    STAR = 'STAR',
    UNSTAR = 'UNSTAR',

    MOVE_TO_INBOX = 'MOVE_TO_INBOX',
    MOVE_TO_TRASH = 'MOVE_TO_TRASH',
    MOVE_TO_ARCHIVE = 'MOVE_TO_ARCHIVE',
    MARK_AS_SPAM = 'MARK_AS_SPAM',
    MARK_AS_NOT_SPAM = 'MARK_AS_NOT_SPAM',
    MOVE_TO_CUSTOM_FOLDER = 'MOVE_TO_CUSTOM_FOLDER',
    LABEL = 'TOOLBAR_LABEL',

    BLOCK_SENDER = 'BLOCK_SENDER',
}

export const enum SOURCE_ACTION {
    HOVER_BUTTONS = 'HOVER_BUTTONS',
    MORE_DROPDOWN = 'MORE_DROPDOWN',
    TOOLBAR = 'TOOLBAR',
    CONTEXT_MENU = 'CONTEXT_MENU',
    DRAG_AND_DROP_MENU = 'DRAG_AND_DROP_MENU',
    SHORTCUTS = 'SHORTCUTS',
    LABEL_DROPDOWN = 'LABEL_DROPDOWN',
    MESSAGE_VIEW = 'MESSAGE_VIEW',
    ITEM_STAR = 'ITEM_STAR',
}

export const enum TIME_RANGE {
    NIGHT = '0-6AM',
    MORNING = '6AM-11AM',
    DAY = '11AM-6PM',
    EVENING = '6PM-12PM',
}

export const enum SELECTED_RANGE {
    ZERO = '0',
    ONE = '1',
    TWO_TO_FIVE = '2-5',
    FIVE_TO_TEN = '5-10',
    TEN_TO_FIFTY = '10-50',
    MORE_THAN_FIFTY = '50+',
    ALL = 'ALL',
}

export const getActionFromLabel = (labelID: string) => {
    switch (labelID) {
        case '0':
            return ACTION_TYPE.MOVE_TO_INBOX;
        /*case '1':
            return 'ALL_DRAFTS';
        case '2':
            return 'ALL_SENT';*/
        case '3':
            return ACTION_TYPE.MOVE_TO_TRASH;
        case '4':
            return ACTION_TYPE.MARK_AS_SPAM;
        case '6':
            return ACTION_TYPE.MOVE_TO_ARCHIVE;
        case '10':
            return ACTION_TYPE.STAR;
        case '16':
            return ACTION_TYPE.SNOOZE;
        default:
            traceInitiativeError('list-actions-telemetry', 'Missing label ID for action');
    }
};

const actionTimeUser = () => {
    const currentHour = new Date().getHours();

    if (currentHour >= 0 && currentHour < 6) {
        return TIME_RANGE.NIGHT;
    } else if (currentHour >= 6 && currentHour < 11) {
        return TIME_RANGE.MORNING;
    } else if (currentHour >= 11 && currentHour < 18) {
        return TIME_RANGE.DAY;
    } else if (currentHour >= 18 && currentHour < 24) {
        return TIME_RANGE.EVENING;
    }
};

export const numberSelectionElements = (selected: number) => {
    if (selected === 0) {
        return SELECTED_RANGE.ZERO;
    } else if (selected === 1) {
        return SELECTED_RANGE.ONE;
    } else if (selected >= 2 && selected < 6) {
        return SELECTED_RANGE.TWO_TO_FIVE;
    } else if (selected >= 6 && selected < 11) {
        return SELECTED_RANGE.FIVE_TO_TEN;
    } else if (selected >= 10 && selected < 51) {
        return SELECTED_RANGE.TEN_TO_FIFTY;
    } else if (selected >= 51) {
        return SELECTED_RANGE.MORE_THAN_FIFTY;
    } else {
        throw new Error('Missing selection');
    }
};

const useListTelemetry = () => {
    const api = useApi();
    const [folders = []] = useFolders();
    const [labels = []] = useLabels();
    const labelID = useMailSelector((store) => store.elements.params.labelID);

    const isListTelemetryEnabled = useFlag('MailWebListTelemetry');

    const sendSimpleActionReport = ({
        actionType,
        actionLocation,
        numberMessage,
        destination,
        percentUnread,
    }: {
        actionType?: ACTION_TYPE;
        actionLocation: SOURCE_ACTION;
        numberMessage: SELECTED_RANGE;
        destination?: string;
        percentUnread?: number;
    }) => {
        if (isListTelemetryEnabled) {
            const actionTime = actionTimeUser();

            const folderActionLocation = folderLocation(labelID, labels, folders);

            void sendTelemetryReport({
                api,
                measurementGroup: TelemetryMeasurementGroups.mailActions,
                event: TelemetryMailListEvents.clicksMailListActions,
                values: {
                    percentUnread: percentUnread,
                },
                dimensions: {
                    actionType: actionType,
                    actionLocation: actionLocation,
                    folderLocation: folderActionLocation,
                    destination: destination,
                    actionTime: actionTime,
                    numberMessage: numberMessage,
                },
                delay: false,
            });
        }
    };

    return {
        sendSimpleActionReport,
    };
};

export default useListTelemetry;
