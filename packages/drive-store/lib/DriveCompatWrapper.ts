import type { DriveCompat } from './useDriveCompat';
import type { PublicDriveCompat } from './usePublicDriveCompat';

export class DriveCompatWrapper<C extends DriveCompat | PublicDriveCompat = DriveCompat | PublicDriveCompat> {
    private userCompat?: DriveCompat;

    private publicCompat?: PublicDriveCompat;

    constructor(dto: { userCompat?: DriveCompat; publicCompat?: PublicDriveCompat }) {
        this.userCompat = dto.userCompat;
        this.publicCompat = dto.publicCompat;
    }

    updateCompatInstance(dto: { userCompat?: DriveCompat; publicCompat?: PublicDriveCompat }) {
        this.userCompat = dto.userCompat;
        this.publicCompat = dto.publicCompat;
    }

    getCompatType(): 'private' | 'public' {
        if (this.userCompat) {
            return 'private';
        }

        return 'public';
    }

    getPublicCompat(): PublicDriveCompat {
        if (!this.publicCompat) {
            throw new Error('Public drive compat not found');
        }

        return this.publicCompat;
    }

    getUserCompat(): DriveCompat {
        if (!this.userCompat) {
            throw new Error('User drive compat not found');
        }

        return this.userCompat;
    }

    getCompat<T = C>(): T {
        if (this.userCompat && this.getCompatType() === 'private') {
            return this.userCompat as T;
        }

        if (this.publicCompat && this.getCompatType() === 'public') {
            return this.publicCompat as T;
        }

        throw new Error('No compatible drive compat instance found');
    }
}
