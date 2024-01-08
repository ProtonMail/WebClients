import { c } from 'ttag';

import { api } from '@proton/pass/lib/api/api';
import type { AliasDetails, AliasMailbox, AliasOptions } from '@proton/pass/types';

export const getAliasOptions = async (shareId: string): Promise<AliasOptions> => {
    const aliasOptions = await api({
        url: `pass/v1/share/${shareId}/alias/options`,
        method: 'get',
    }).then(({ Options }) => {
        if (!Options) throw new Error(c('Error').t`Alias options could not be resolved`);
        return Options;
    });

    const options: AliasOptions = {
        suffixes: aliasOptions.Suffixes.map((data) => ({
            signedSuffix: data.SignedSuffix!,
            suffix: data.Suffix!,
            isCustom: data.IsCustom!,
            domain: data.Domain!,
        })),
        mailboxes: aliasOptions.Mailboxes.map((mailbox) => ({
            email: mailbox.Email,
            id: mailbox.ID,
        })),
    };

    return options;
};

export const getAliasDetails = async (shareId: string, itemId: string): Promise<AliasDetails> => {
    const result = await api({
        url: `pass/v1/share/${shareId}/alias/${itemId}`,
        method: 'get',
    });

    return {
        aliasEmail: result.Alias!.Email,
        mailboxes: result.Alias!.Mailboxes.map(({ Email, ID }): AliasMailbox => ({ id: ID, email: Email })),
    };
};
