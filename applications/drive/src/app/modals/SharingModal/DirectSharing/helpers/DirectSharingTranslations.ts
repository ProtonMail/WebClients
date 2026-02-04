import { c } from 'ttag';

export const MemberRoleTranslations = {
    get viewer() {
        return c('Label').t`can view`;
    },
    get editor() {
        return c('Label').t`can edit`;
    },
    get admin() {
        return c('Label').t`admin`;
    },
};

export const InvitationStateTranslations = {
    get pending() {
        return c('Status').t`pending`;
    },
    get userRegistered() {
        return c('Status').t`accepted`;
    },
};
