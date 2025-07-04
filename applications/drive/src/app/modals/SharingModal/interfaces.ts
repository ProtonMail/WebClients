import type { MemberRole, NonProtonInvitation } from '@proton/drive/index';

export enum MemberType {
    Member = 'member',
    ProtonInvitation = 'protonInvitation',
    NonProtonInvitation = 'nonProtonInvitation',
}

export interface DirectMember {
    uid: string;
    inviteeEmail: string;
    role: MemberRole;
    state?: NonProtonInvitation['state'];
    type: MemberType;
}
