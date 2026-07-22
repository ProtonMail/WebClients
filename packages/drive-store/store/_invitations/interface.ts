import type { ShareInvitationDetails } from '../_shares/interface';

export interface ExtendedInvitationDetails extends ShareInvitationDetails {
    decryptedLinkName?: string;
    isLocked?: boolean;
}
