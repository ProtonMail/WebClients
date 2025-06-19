import { useKeyPress } from '@proton/components';
import { useItemsActions } from '@proton/pass/components/Item/ItemActionsProvider';
import { useSpotlightFor } from '@proton/pass/components/Spotlight/WithSpotlight';
import { useAutotypeActions } from '@proton/pass/hooks/autotype/useAutotypeActions';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { type Item, SpotlightMessage } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import noop from '@proton/utils/noop';

export const useAutotypeShortcut = DESKTOP_BUILD
    ? (data: Item<'login'>) => {
          const autotypeEnabled = useFeatureFlag(PassFeature.PassDesktopAutotype);
          const { actions } = useAutotypeActions(data);
          const { autotypeConfirmShortcut } = useItemsActions();
          const confirmationSpotlight = useSpotlightFor(SpotlightMessage.AUTOTYPE_CONFIRM_SHORTCUT);
          const action = actions[0];

          useKeyPress(
              (evt) => {
                  if (autotypeEnabled && action && (evt.ctrlKey || evt.metaKey) && evt.shiftKey && evt.key === 'v') {
                      evt.preventDefault();
                      const autotypeProps = action.getAutotypeProps();

                      if (confirmationSpotlight.open) {
                          return autotypeConfirmShortcut({
                              autotypeProps,
                              spotlightToClose: confirmationSpotlight,
                          });
                      }
                      void window.ctxBridge?.autotype(autotypeProps);
                  }
              },
              [action, confirmationSpotlight, autotypeEnabled]
          );
      }
    : noop;
