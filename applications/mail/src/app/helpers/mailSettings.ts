import { VIEW_LAYOUT, VIEW_MODE } from 'proton-shared/lib/constants';

interface MailSettings {
    ViewLayout?: number;
    ViewMode?: number;
}

export const isColumnMode = ({ ViewLayout = VIEW_LAYOUT.COLUMN }: MailSettings = {}) =>
    ViewLayout === VIEW_LAYOUT.COLUMN;
export const isConversationMode = ({ ViewMode = VIEW_MODE.GROUP }: MailSettings = {}) => ViewMode === VIEW_MODE.GROUP;
