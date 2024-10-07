import type { ShareInvitationDetails } from '../_shares';

export interface ExtendedInvitationDetails extends ShareInvitationDetails {
    isLocked?: boolean;
}
