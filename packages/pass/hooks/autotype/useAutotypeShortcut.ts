import { useSelector } from 'react-redux';

import useKeyPress from '@proton/components/hooks/useKeyPress';
import { useItemsActions } from '@proton/pass/components/Item/ItemActionsProvider';
import { useSpotlightFor } from '@proton/pass/components/Spotlight/WithSpotlight';
import { useAutotypeActions } from '@proton/pass/hooks/autotype/useAutotypeActions';
import { useAutotypeExecute } from '@proton/pass/hooks/autotype/useAutotypeExecute';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { selectPassPlan, selectUserPlan } from '@proton/pass/store/selectors';
import { type Item, SpotlightMessage } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import noop from '@proton/utils/noop';

export const useAutotypeShortcut = DESKTOP_BUILD
    ? (data: Item<'login'>) => {
          const autotypeEnabled = useFeatureFlag(PassFeature.PassDesktopAutotype);
          const isFreePlan = useSelector(selectPassPlan) === UserPassPlan.FREE;
          const isPassEssentials = useSelector(selectUserPlan)?.InternalName === 'passpro2024';
          const { actions } = useAutotypeActions(data);
          const executeAutotype = useAutotypeExecute();
          const { autotypeConfirmShortcut } = useItemsActions();
          const confirmationSpotlight = useSpotlightFor(SpotlightMessage.AUTOTYPE_CONFIRM_SHORTCUT);
          const action = actions[0];

          useKeyPress(
              (evt) => {
                  if (
                      autotypeEnabled &&
                      !isFreePlan &&
                      !isPassEssentials &&
                      action &&
                      (evt.ctrlKey || evt.metaKey) &&
                      evt.shiftKey &&
                      evt.code === 'KeyV'
                  ) {
                      evt.preventDefault();
                      const autotypeProps = action.getAutotypeProps();

                      if (confirmationSpotlight.open) {
                          return autotypeConfirmShortcut({
                              autotypeProps,
                              spotlightToClose: confirmationSpotlight,
                          });
                      }
                      void executeAutotype?.(autotypeProps);
                  }
              },
              [action, confirmationSpotlight, autotypeEnabled, isFreePlan, isPassEssentials]
          );
      }
    : noop;
