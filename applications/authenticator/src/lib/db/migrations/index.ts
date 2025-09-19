import type { AuthenticatorDB } from 'proton-authenticator/lib/db/db';
import { qaDowngradeDB } from 'proton-authenticator/lib/db/migrations/qa';

import v1 from './v1';
import v2 from './v2';
import v3 from './v3';
import v4 from './v4';

const setupDBVersions = (db: AuthenticatorDB) => {
    v1(db);
    v2(db);
    v3(db);
    v4(db);

    if (process.env.QA_BUILD) {
        const self = window as any;
        self['qa::db::downgrade'] = () => qaDowngradeDB(db);
    }
};

export default setupDBVersions;
