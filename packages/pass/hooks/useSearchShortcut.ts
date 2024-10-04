import { useKeyPress } from '@proton/components';
import noop from '@proton/utils/noop';

export const useSearchShortcut = DESKTOP_BUILD
    ? (onTriggered: () => void) => {
          useKeyPress(
              (evt) => {
                  if ((evt.ctrlKey || evt.metaKey) && evt.key === 'f') {
                      evt.preventDefault();
                      onTriggered();
                  }
              },
              [onTriggered]
          );
      }
    : noop;
