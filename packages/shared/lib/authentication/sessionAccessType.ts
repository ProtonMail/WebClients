import { hasBit, setBit } from '../helpers/bitset';
import type { User } from '../interfaces/User';
import { AccessType } from './accessType';

/**
 * How the API describes the way a session accesses an account, mirroring `AccessType` in
 * AccountInternalBundle. Unlike {@link AccessType} these are not mutually exclusive.
 */
export enum SessionAccessTypeFlag {
    AdminAccess = 1 << 0,
    DelegatedAccess = 1 << 1,
    OrgAccess = 1 << 2,
}

/** A bitmask of {@link SessionAccessTypeFlag}, as returned in `AccessType` from `auth/v4/sessions/local`. */
export type SessionAccessTypeMask = number;

/** A plain self session sets none of the flags. */
export const selfAccessTypeMask: SessionAccessTypeMask = 0;

/**
 * Derive the session access type from a user, as it would have been returned in `AccessType` from `auth/v4/sessions/local`.
 */
export const getSessionAccessTypeMask = (user: User): SessionAccessTypeMask => {
    let mask = selfAccessTypeMask;
    if (user.OrganizationPrivateKey) {
        mask = setBit(mask, SessionAccessTypeFlag.AdminAccess);
    }
    if (user.Flags?.['delegated-access']) {
        mask = setBit(mask, SessionAccessTypeFlag.DelegatedAccess);
    }
    if (user.Flags?.['org-access']) {
        mask = setBit(mask, SessionAccessTypeFlag.OrgAccess);
    }
    return mask;
};

/**
 * Collapse a mask into a single {@link AccessType} for rendering in the UI.
 */
export const getAccessTypeFromMask = (mask: SessionAccessTypeMask): AccessType => {
    if (hasBit(mask, SessionAccessTypeFlag.AdminAccess)) {
        return AccessType.AdminAccess;
    }
    if (hasBit(mask, SessionAccessTypeFlag.DelegatedAccess)) {
        return AccessType.EmergencyAccess;
    }
    if (hasBit(mask, SessionAccessTypeFlag.OrgAccess)) {
        return AccessType.Msp;
    }
    return AccessType.Self;
};

/**
 * Widen a single {@link AccessType} into a mask. `AccessType.Msp` is 3 where `OrgAccess` is 4.
 */
export const getMaskFromAccessType = (accessType: AccessType): SessionAccessTypeMask => {
    switch (accessType) {
        case AccessType.AdminAccess:
            return SessionAccessTypeFlag.AdminAccess;
        case AccessType.EmergencyAccess:
            return SessionAccessTypeFlag.DelegatedAccess;
        case AccessType.Msp:
            return SessionAccessTypeFlag.OrgAccess;
        case AccessType.Self:
            return selfAccessTypeMask;
    }
};
