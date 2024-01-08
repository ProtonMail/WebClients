export type AliasMailbox = { email: string; id: number };

export type AliasSuffix = {
    suffix: string;
    signedSuffix: string;
    isCustom: boolean;
    domain: string;
};

export type AliasOptions = {
    mailboxes: AliasMailbox[];
    suffixes: AliasSuffix[];
};

export type AliasDetails = {
    aliasEmail: string;
    mailboxes: AliasMailbox[];
};
