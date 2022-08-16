import { c } from 'ttag';

const getNotificationsTexts = () => {
    return {
        addNotificationText: c('Action').t`Add notification`,
        addNotificationTitle: c('Title').t`Add another notification to remind you of this event`,
        removeNotificationText: c('Action').t`Remove this notification`,
        notificationTypeText: c('Notification type').t`notification`,
        emailTypeText: c('Notification type').t`email`,
        howToSendText: c('Title').t`Select the way to send this notification`,
        whenToSendText: c('Title').t`Select when you want this notification to be sent`,
        timeToSendText: c('Title').t`Select the time to send this notification`,
        atText: c('Notification time input').t`at`,
        chooseANumberText: c('Title (number of minutes/hours/days/weeks)').t`Choose a number`,
    };
};

export default getNotificationsTexts;
