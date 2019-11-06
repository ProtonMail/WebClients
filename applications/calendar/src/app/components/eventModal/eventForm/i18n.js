import { c } from 'ttag';

export const getI18N = (type) => {
    return {
        event: {
            create: c('Title').t`Create new event`,
            update: c('Title').t`Edit event`,
            created: c('Success').t`Event created`,
            updated: c('Success').t`Event updated`,
            deleted: c('Success').t`Event deleted`,
            delete: c('Tooltip').t`Delete event`
        },
        task: {
            create: c('Title').t`Create new task`,
            update: c('Title').t`Edit task`,
            created: c('Success').t`Task created`,
            updated: c('Success').t`Task updated`,
            deleted: c('Success').t`Task deleted`,
            delete: c('Tooltip').t`Delete task`
        },
        alarm: {
            create: c('Title').t`Create new alarm`,
            update: c('Title').t`Edit alarm`,
            created: c('Success').t`Alarm created`,
            updated: c('Success').t`Alarm updated`,
            deleted: c('Success').t`Alarm deleted`,
            delete: c('Tooltip').t`Delete alarm`
        }
    }[type];
};
