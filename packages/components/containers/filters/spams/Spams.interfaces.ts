export type SpamNavItem = 'ALL' | SpamLocation;

export type SpamLocation = 'SPAM' | 'NON_SPAM' | 'BLOCKED';

interface SpamBase {
    id: string;
    location: SpamLocation;
}

interface SpamEmailItem extends SpamBase {
    email: string | undefined;
}

interface SpamDomainItem extends SpamBase {
    domain: string | undefined;
}

/**
 * A spam item can be a domain or an email address
 */
export type SpamItem = SpamEmailItem | SpamDomainItem;

export type SpamListActionName = 'block' | 'delete' | 'spam' | 'unspam';
export type SpamListAction = { name: string; onClick: () => void };
