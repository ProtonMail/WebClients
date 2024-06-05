import useKeyPress from '@proton/components/hooks/useKeyPress';
import { DESKTOP_BUILD } from '@proton/pass/lib/client';
import noop from '@proton/utils/noop';

export const useNewItemShortcut = DESKTOP_BUILD
    ? (onTriggered: () => void) => {
          useKeyPress(
              (evt) => {
                  if ((evt.ctrlKey || evt.metaKey) && evt.key === 'n') {
                      evt.preventDefault();
                      onTriggered();
                  }
              },
              [onTriggered]
          );
      }
    : noop;
