import { useKeyPress } from '@proton/components';
import { useItemsActions } from '@proton/pass/components/Item/ItemActionsProvider';
import { useSpotlightFor } from '@proton/pass/components/Spotlight/WithSpotlight';
import { useAutotypeActions } from '@proton/pass/hooks/autotype/useAutotypeActions';
import { type Item, SpotlightMessage } from '@proton/pass/types';
import noop from '@proton/utils/noop';

export const useAutotypeShortcut = DESKTOP_BUILD
    ? (data: Item<'login'>) => {
          const { actions } = useAutotypeActions(data);
          const { autotypeConfirmShortcut } = useItemsActions();
          const confirmationSpotlight = useSpotlightFor(SpotlightMessage.AUTOTYPE_CONFIRM_SHORTCUT);
          const action = actions[0];

          useKeyPress(
              (evt) => {
                  if (action && (evt.ctrlKey || evt.metaKey) && evt.shiftKey && evt.key === 'v') {
                      evt.preventDefault();
                      const autotypeProps = action.getAutotypeProps();

                      if (confirmationSpotlight.open) {
                          return autotypeConfirmShortcut({
                              autotypeProps,
                              /* Required to fix edge case where confirmation is always shown
                               * unless user exits the current login view (due to `useSpotlightFor`
                               * not updating in real-time but only on component mount) */
                              onConfirm: confirmationSpotlight.close,
                          });
                      }
                      void window.ctxBridge?.autotype(autotypeProps);
                  }
              },
              [action, confirmationSpotlight]
          );
      }
    : noop;
