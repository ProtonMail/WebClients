import { Nullable } from '@proton/shared/lib/interfaces';

export interface EventInternalProperties {
    Permissions: number;
    IsOrganizer: 1 | 0;
    IsProtonProtonInvite: 1 | 0;
    Color: Nullable<string> | undefined;
}
