import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import type { AutotypeProperties } from '../../types';
import { logger } from '../../utils/logger';

export const useAutotypeExecute = DESKTOP_BUILD
    ? () => {
          const { createNotification } = useNotifications();

          return ({ fields, enterAtTheEnd }: AutotypeProperties) =>
              window.ctxBridge
                  ?.autotype({
                      fields,
                      enterAtTheEnd,
                  })
                  .catch((error) => {
                      logger.error(`[Autotype] Failed to autotype (${error})`);
                      createNotification({
                          type: 'warning',
                          text: c('Warning')
                              .t`Failed to autotype. Please make sure ${PASS_APP_NAME} has the necessary permissions and try again (${error}).`,
                      });
                  });
      }
    : noop;
