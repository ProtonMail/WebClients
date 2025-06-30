import { PASSWORD_CHANGE_MESSAGE_TYPE, sendMessageToTabs } from '@proton/shared/lib/helpers/crossTab';

export const sendPasswordChangeMessageToTabs = (data: { localID: number; status: boolean }) => {
    sendMessageToTabs(PASSWORD_CHANGE_MESSAGE_TYPE, data);
};
