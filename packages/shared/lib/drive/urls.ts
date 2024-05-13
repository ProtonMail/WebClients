import { getStaticURL } from '@proton/shared/lib/helpers/url';

import { getAppHref } from '../apps/helper';
import { APPS } from '../constants';

export const DRIVE_LANDING_PAGE = getStaticURL('/drive');
export const DRIVE_PRICING_PAGE = getStaticURL('/drive/pricing?product=drive');
export const DRIVE_SIGNUP = getAppHref('/drive/signup', APPS.PROTONACCOUNT);
export const DRIVE_IOS_APP = 'https://apps.apple.com/app/proton-drive-cloud-storage/id1509667851';
export const DRIVE_ANDROID_APP = 'https://play.google.com/store/apps/details?id=me.proton.android.drive';
