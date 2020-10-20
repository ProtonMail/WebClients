import { ORGANIZATION_FLAGS } from '../constants';
import { hasBit } from './bitset';
import { Organization } from '../interfaces';

export const isLoyal = (organization: Partial<Organization> = {}) => {
    return hasBit(organization.Flags, ORGANIZATION_FLAGS.LOYAL);
};

export const hasCovid = (organization: Partial<Organization> = {}) => {
    return hasBit(organization.Flags, ORGANIZATION_FLAGS.COVID);
};

export const hasBonuses = (organization: Partial<Organization> = {}) => {
    return !!organization.Flags;
};
