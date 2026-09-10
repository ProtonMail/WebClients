import type { AuthenticatorDB } from '../types';
import { qaDowngradeDB } from './qa';
import v1 from './v1';
import v2 from './v2';
import v3 from './v3';
import v4 from './v4';
import v5 from './v5';

const setupDBVersions = (db: AuthenticatorDB) => {
    v1(db);
    v2(db);
    v3(db);
    v4(db);
    v5(db);

    if (process.env.QA_BUILD) {
        const self = window as any;
        self['qa::db::downgrade'] = () => qaDowngradeDB(db);
    }
};

export default setupDBVersions;
