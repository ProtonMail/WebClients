import { type FC, useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { useAuthService } from 'proton-pass-web/app/Context/AuthServiceProvider';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { useNotifications } from '@proton/components/hooks';
import { UpsellingModal } from '@proton/pass/components/Upsell/UpsellingModal';
import { UpsellRef } from '@proton/pass/constants';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { useNotificationEnhancer } from '@proton/pass/hooks/useNotificationEnhancer';
import { selectPassPlan } from '@proton/pass/store/selectors';
import { PassFeature } from '@proton/pass/types/api/features';
import { UserPassPlan } from '@proton/pass/types/api/plan';

export const EarlyAccess: FC =
    BUILD_TARGET === 'darwin' || BUILD_TARGET === 'linux'
        ? () => {
              const freeAccessEnabled = useFeatureFlag(PassFeature.PassEnableDesktopFreePlan);
              const [upgradeState, setUpgradeState] = useState<{ upgrade: boolean }>({ upgrade: false });
              const forceUpgrade = [UserPassPlan.FREE, UserPassPlan.TRIAL].includes(useSelector(selectPassPlan));
              const authService = useAuthService();

              const { createNotification, clearNotifications } = useNotifications();
              const enhance = useNotificationEnhancer();

              const onLogout = useCallback(async () => {
                  createNotification(enhance({ text: c('Info').t`Logging you out...`, type: 'info', loading: true }));
                  await authService.logout({ soft: false });
                  clearNotifications();
              }, []);

              useEffect(() => {
                  setUpgradeState({ upgrade: !freeAccessEnabled && forceUpgrade });
              }, [freeAccessEnabled, forceUpgrade]);

              return upgradeState.upgrade ? (
                  <UpsellingModal
                      upsellType="early-access"
                      open={upgradeState.upgrade}
                      closable={false}
                      upsellRef={UpsellRef.EARLY_ACCESS}
                      extraActions={() => [
                          <Button pill shape="solid" color="weak" onClick={onLogout} key="sign-out">{c('Action')
                              .t`Sign out`}</Button>,
                      ]}
                  />
              ) : null;
          }
        : () => null;
