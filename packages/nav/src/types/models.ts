import type { OrganizationExtended } from '@proton/shared/lib/interfaces/Organization';
import type { UserModel } from '@proton/shared/lib/interfaces/User';

export interface NavContext {
    user: UserModel;
    organization?: OrganizationExtended;
}
