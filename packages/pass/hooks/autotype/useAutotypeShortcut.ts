import { useSelector } from 'react-redux';

import useKeyPress from '@proton/components/hooks/useKeyPress';
import noop from '@proton/utils/noop';

import { useItemsActions } from '../../components/Item/ItemActionsProvider';
import { useSpotlightFor } from '../../components/Spotlight/WithSpotlight';
import { selectUserAutoTypeAllowed } from '../../store/selectors/user';
import { PassFeature } from '../../types/api/features';
import type { ShareId } from '../../types/crypto/pass-types';
import type { Item } from '../../types/data/items';
import { SpotlightMessage } from '../../types/worker/spotlight';
import { useFeatureFlag } from '../useFeatureFlag';
import { useAutotypeActions } from './useAutotypeActions';
import { useAutotypeExecute } from './useAutotypeExecute';

export const useAutotypeShortcut = DESKTOP_BUILD
    ? (data: Item<'login'>, shareId: ShareId) => {
          const autotypeEnabled = useFeatureFlag(PassFeature.PassDesktopAutotype);
          const autoTypeAllowed = useSelector(selectUserAutoTypeAllowed);
          const { actions } = useAutotypeActions(data, shareId);
          const executeAutotype = useAutotypeExecute();
          const { autotypeConfirmShortcut } = useItemsActions();
          const confirmationSpotlight = useSpotlightFor(SpotlightMessage.AUTOTYPE_CONFIRM_SHORTCUT);
          const action = actions[0];

          useKeyPress(
              (evt) => {
                  if (
                      autotypeEnabled &&
                      autoTypeAllowed &&
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
              [action, confirmationSpotlight, autotypeEnabled, autoTypeAllowed]
          );
      }
    : noop;
