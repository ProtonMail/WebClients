import { ORGANIZATION_FLAGS } from '../constants';
import { hasBit } from './bitset';

export const isLoyal = (organization = {}) => {
    return hasBit(organization.Flags, ORGANIZATION_FLAGS.LOYAL);
};
