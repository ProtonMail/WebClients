import { deleteEvent } from 'proton-shared/lib/api/calendars';
import { Api } from 'proton-shared/lib/interfaces';
import { DELETE_CONFIRMATION_TYPES, RECURRING_TYPES } from '../../../constants';
import { getEventDeletedText } from '../../../components/eventModal/eventForm/i18n';

interface Arguments {
    oldCalendarID: string;
    oldEventID: string;

    onDeleteConfirmation: (data: any) => Promise<RECURRING_TYPES>;
    api: Api;
    call: () => Promise<void>;
    createNotification: (data: any) => void;
}

const handleDeleteSingleEvent = async ({
    oldCalendarID,
    oldEventID,

    onDeleteConfirmation,
    api,
    call,
    createNotification,
}: Arguments) => {
    await onDeleteConfirmation({ type: DELETE_CONFIRMATION_TYPES.SINGLE });
    await api(deleteEvent(oldCalendarID, oldEventID));
    await call();

    createNotification({ text: getEventDeletedText() });
};

export default handleDeleteSingleEvent;
