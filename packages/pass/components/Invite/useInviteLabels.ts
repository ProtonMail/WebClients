import { useMemo } from 'react';

import { c } from 'ttag';

import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { PassFeature } from '@proton/pass/types/api/features';

export type InviteLabels = {
    title: string;
    singleAction: string;
    multipleAction: string;
};

// TODO: Remove this in IDTEAM-4660
export const useInviteLabels = () => {
    const enabled = useFeatureFlag(PassFeature.PassRenameAdminToManager);

    return useMemo<InviteLabels>(
        () =>
            enabled
                ? {
                      title: c('Info').t`Manager`,
                      singleAction: c('Action').t`Make manager`,
                      multipleAction: c('Label').t`Make all managers`,
                  }
                : {
                      title: c('Info').t`Admin`,
                      singleAction: c('Action').t`Make admin`,
                      multipleAction: c('Label').t`Make all admins`,
                  },
        [enabled]
    );
};
