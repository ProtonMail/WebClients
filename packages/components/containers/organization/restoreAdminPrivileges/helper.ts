import { c } from 'ttag';

import { getInitials } from '@proton/shared/lib/helpers/string';
import type { Member } from '@proton/shared/lib/interfaces';
import { getMemberEmailOrName } from '@proton/shared/lib/keys/memberHelper';
import clamp from '@proton/utils/clamp';

export const getMemberInitials = (member: Member) => getInitials(member.Name || getMemberEmailOrName(member));

export const getMemberEmailList = (members: Member[]) => members.map(getMemberEmailOrName).join(', ');

/**
 * Converting a member costs a handful of sequential API round trips (privatize, refetch, request the
 * unprivatization, refetch), so the reset takes roughly this many members per minute.
 */
const MEMBERS_CONVERTED_PER_MINUTE = 20;

/** How long the estimate is allowed to claim, in minutes. */
const MIN_ESTIMATED_MINUTES = 1;
const MAX_ESTIMATED_MINUTES = 5;

/**
 * A rough estimate of how long the reset will take, so the copy can be specific rather than always promising the
 * same few minutes. Kept deliberately coarse: it is only there to set the expectation that the administrator has to
 * leave the tab open.
 */
export const getEstimatedResetMinutes = (affectedMemberCount: number) => {
    return clamp(
        Math.ceil(affectedMemberCount / MEMBERS_CONVERTED_PER_MINUTE),
        MIN_ESTIMATED_MINUTES,
        MAX_ESTIMATED_MINUTES
    );
};

export const getCopiedEmailNotification = () => c('Info').t`Email address copied to clipboard`;

export const getCopiedEmailListNotification = () => c('Info').t`Email addresses copied to clipboard`;

/**
 * Resetting the organization key generates a brand new key, so nothing that was encrypted with the old one is lost,
 * but the user groups cannot be re-encrypted without access to the old key.
 */
export const getResetOrganizationKeyDataText = () =>
    c('organization key reset')
        .t`Resetting the organization key generates a new encryption key to keep your organization's data secure. **No data will be lost or destroyed in this process, but the users groups will be deleted.**`;
