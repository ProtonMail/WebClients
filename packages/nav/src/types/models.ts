import type { OrganizationExtended, UserModel } from '@proton/shared/lib/interfaces';

export interface NavContext {
    user: UserModel;
    organization?: OrganizationExtended;
}
