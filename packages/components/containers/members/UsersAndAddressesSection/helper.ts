import { c, msgid } from 'ttag';

import { hasBit } from '@proton/shared/lib/helpers/bitset';
import type { EnhancedMember } from '@proton/shared/lib/interfaces';
import { TwoFactorStatusFlags } from '@proton/shared/lib/interfaces';

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

export const getUser2FATagProps = (member: EnhancedMember) => {
    const hasTotp = hasBit(member['2faStatus'], TwoFactorStatusFlags.Totp);
    const hasFido = hasBit(member['2faStatus'], TwoFactorStatusFlags.Fido2);
    let twoFactorTooltip;

    if (hasTotp && hasFido) {
        twoFactorTooltip = c('Users table: badge')
            .t`User has enabled two-factor authentication with an authenticator app and a security key.`;
    } else if (hasTotp) {
        twoFactorTooltip = c('Users table: badge')
            .t`User has enabled two-factor authentication with an authenticator app.`;
    } else if (hasFido) {
        twoFactorTooltip = c('Users table: badge').t`User has enabled two-factor authentication with a security key.`;
    }

    return { hasTwoFactor: hasTotp || hasFido, twoFactorTooltip };
};
