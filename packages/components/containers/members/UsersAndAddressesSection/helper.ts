import { c, msgid } from 'ttag';

export const getInvitationLimit = (n: number) => {
    return c('familyOffer_2023:Family plan').ngettext(
        msgid`You have reached the limit of ${n} accepted invitation in 6 months.`,
        `You have reached the limit of ${n} accepted invitations in 6 months.`,
        n
    );
};

export const getInvitationAcceptLimit = (n: number) => {
    return c('familyOffer_2023:Family plan').ngettext(
        msgid`Only ${n} accepted invitation are allowed in a 6-month period.`,
        `Only ${n} accepted invitations are allowed in a 6-month period.`,
        n
    );
};

export const getInviteLimit = (n: number) => {
    return c('familyOffer_2023:Family plan').ngettext(
        msgid`You have reached the limit of ${n} accepted invitation in 6 months. The button will become clickable when you can invite additional users.`,
        `You have reached the limit of ${n} accepted invitations in 6 months. The button will become clickable when you can invite additional users.`,
        n
    );
};
