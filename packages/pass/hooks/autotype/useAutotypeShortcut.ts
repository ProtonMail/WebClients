import { useSelector } from 'react-redux';

import useKeyPress from '@proton/components/hooks/useKeyPress';
import noop from '@proton/utils/noop';

import { useItemsActions } from '../../components/Item/ItemActionsProvider';
import { useSpotlightFor } from '../../components/Spotlight/WithSpotlight';
import { selectPassPlan, selectUserPlan } from '../../store/selectors';
import { type Item, SpotlightMessage } from '../../types';
import { PassFeature } from '../../types/api/features';
import { UserPassPlan } from '../../types/api/plan';
import { useFeatureFlag } from '../useFeatureFlag';
import { useAutotypeActions } from './useAutotypeActions';
import { useAutotypeExecute } from './useAutotypeExecute';

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
