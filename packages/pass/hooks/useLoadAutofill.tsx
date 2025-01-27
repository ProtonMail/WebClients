import { useEffect } from 'react';

import { WorkerMessageType } from '@proton/pass/types';
import { sendExtensionMessage } from '@proton/shared/lib/browser/extension';
import { APPS } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

/** Allows Pass browser extension to autofill/autosuggest the current page.
 * This hook is needed for Pass web app as its URL is explicitly excluded in Pass extension manifest.json */
export const useLoadAutofill =
    BUILD_TARGET === 'web'
        ? () => {
              useEffect(() => {
                  sendExtensionMessage(
                      { type: WorkerMessageType.LOAD_CONTENT_SCRIPT_EXTERNAL },
                      { app: APPS.PROTONPASSBROWSEREXTENSION, maxTimeout: 1_000 }
                  ).catch(noop);

                  return () => {
                      sendExtensionMessage(
                          { type: WorkerMessageType.UNLOAD_CONTENT_SCRIPT_EXTERNAL },
                          { app: APPS.PROTONPASSBROWSEREXTENSION, maxTimeout: 1_000 }
                      ).catch(noop);
                  };
              }, []);

              return;
          }
        : noop;
