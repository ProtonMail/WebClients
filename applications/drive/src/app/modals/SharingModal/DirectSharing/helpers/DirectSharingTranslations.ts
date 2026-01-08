import { c } from 'ttag';

export const MemberRoleTranslations = {
    get viewer() {
        return c('Label').t`Viewer`;
    },
    get editor() {
        return c('Label').t`Editor`;
    },
    get admin() {
        return c('Label').t`Admin`;
    },
};

export const InvitationStateTranslations = {
    get pending() {
        return c('Status').t`Pending`;
    },
    get userRegistered() {
        return c('Status').t`Accepted`;
    },
};
