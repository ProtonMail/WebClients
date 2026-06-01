import type { MemberRole, NonProtonInvitation } from '@protontech/drive-sdk';

export enum MemberType {
    Member = 'member',
    ProtonInvitation = 'protonInvitation',
    NonProtonInvitation = 'nonProtonInvitation',
}

export interface DirectMember {
    uid: string;
    inviteeEmail: string;
    role: DirectSharingRole;
    state?: NonProtonInvitation['state'];
    type: MemberType;
}
export type DirectSharingRole = MemberRole.Viewer | MemberRole.Editor | MemberRole.Admin;
