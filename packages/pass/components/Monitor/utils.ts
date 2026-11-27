import { c } from 'ttag';

import { IcAlias } from '@proton/icons/icons/IcAlias';
import { IcClockRotateLeft } from '@proton/icons/icons/IcClockRotateLeft';
import { IcCode } from '@proton/icons/icons/IcCode';
import { IcFolders } from '@proton/icons/icons/IcFolders';
import { IcKey } from '@proton/icons/icons/IcKey';
import { IcKeySkeleton } from '@proton/icons/icons/IcKeySkeleton';
import { IcLock } from '@proton/icons/icons/IcLock';
import { IcPaperClip } from '@proton/icons/icons/IcPaperClip';
import { IcPassShieldOk } from '@proton/icons/icons/IcPassShieldOk';
import { IcServers } from '@proton/icons/icons/IcServers';
import { IcShield } from '@proton/icons/icons/IcShield';
import { IcSliders } from '@proton/icons/icons/IcSliders';
import { IcUser } from '@proton/icons/icons/IcUser';
import { IcUsers } from '@proton/icons/icons/IcUsers';
import { IcUsersPlus } from '@proton/icons/icons/IcUsersPlus';
import { DARK_WEB_MONITORING_NAME, PROTON_SENTINEL_NAME } from '@proton/shared/lib/constants';

import { MAX_VAULT_MEMBERS } from '../../constants';
import type { PlanFeaturesType } from '../Upsell/types';

export const getPlanFeatures = (): PlanFeaturesType => ({
    individuals: [
        { icon: IcPassShieldOk, label: DARK_WEB_MONITORING_NAME },
        { icon: IcUser, label: PROTON_SENTINEL_NAME },
        { icon: IcLock, label: c('Feature').t`Integrated 2FA authenticator` },
        { icon: IcAlias, label: c('Feature').t`Unlimited hide-my-email aliases` },
        { icon: IcUsersPlus, label: c('Feature').t`Vault sharing (up to ${MAX_VAULT_MEMBERS} people)` },
    ],
    business: [
        { icon: IcKey, label: c('new_plans: feature').t`SSO and SCIM` },
        { icon: IcClockRotateLeft, label: c('new_plans: feature').t`Detailed activity logs` },
        { icon: IcSliders, label: c('new_plans: feature').t`Enterprise policies` },
        { icon: IcShield, label: c('new_plans: feature').t`Advanced account protection` },
        { icon: IcPaperClip, label: c('new_plans: feature').t`File attachment` },
        { icon: IcFolders, label: c('new_plans: feature').t`Folders and subfolders` },
        { icon: IcServers, label: c('new_plans: feature').t`SIEM integration` },
        { icon: IcCode, label: c('new_plans: feature').t`Command line interface (CLI)` },
        { icon: IcUsers, label: c('new_plans: feature').t`Group sharing` },
        { icon: IcKeySkeleton, label: c('new_plans: feature').t`SSH agent` },
    ],
});
