import type { Location } from 'history';

import { getSearchParams } from '@proton/shared/lib/helpers/url';

export enum CONTACT_SEARCH_PARAMS {
    CREATE_CONTACT = 'create-contact',
    EDIT_CONTACT = 'edit-contact',
    CREATE_CONTACT_GROUP = 'create-contact-group',
    EDIT_CONTACT_GROUP = 'edit-contact-group',
}

export const contactSearchParams: CONTACT_SEARCH_PARAMS[] = Object.values(CONTACT_SEARCH_PARAMS);

export const isContactSearchParams = (location: Location) => {
    if (!location.hash) {
        return false;
    }

    const params = getSearchParams(location.hash);

    const res = Object.keys(params).some((key) => contactSearchParams.includes(key as CONTACT_SEARCH_PARAMS));

    return res;
};
