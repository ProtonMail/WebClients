import { type FC, useCallback } from 'react';

import { resetWithSnapshot } from 'proton-authenticator/lib/db/migrations/v4';
import logger from 'proton-authenticator/lib/logger';
import { useAppSelector } from 'proton-authenticator/store/utils';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Prompt from '@proton/components/components/prompt/Prompt';
import { GenericErrorDisplay } from '@proton/components/containers/error/GenericError';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useConfirm } from '@proton/pass/hooks/useConfirm';
import { prop } from '@proton/pass/utils/fp/lens';

const reload = () => window.location.reload();

export const ErrorScreen: FC = () => {
    const { createNotification } = useNotifications();

    const { error } = useAppSelector(prop('app'));
    const migrationError = error?.name === 'AuthenticatorDBMigrationError';

    const reset = useConfirm(
        useCallback(async () => {
            const result = await resetWithSnapshot();
            if (!result.ok) {
                logger.warn(`[ErrorScreen::reset] failed reset: ${result.error ?? ''}`);
                return createNotification({ type: 'error', text: result.error });
            }

            reload();
        }, [])
    );

    return (
        <div className="w-full h-full flex justify-center items-center">
            <GenericErrorDisplay>
                <div
                    className="flex flex-columns justify-center gap-2 max-w-custom"
                    style={{ '--max-w-custom': '18rem' }}
                >
                    {error?.message && <div className="text-sm text-center mb-2">{error.message}</div>}
                    <Button color="norm" className="w-full cta-button" onClick={reload} disabled={reset.pending}>
                        <span>{migrationError ? c('Action').t`Try again` : c('Action').t`Reload app`}</span>
                    </Button>

                    {migrationError && (
                        <Button
                            color="danger"
                            pill
                            className="w-full cta-button"
                            onClick={reset.prompt}
                            loading={reset.pending}
                        >
                            <span>{c('Action').t`Backup and reset`}</span>
                        </Button>
                    )}
                </div>
            </GenericErrorDisplay>

            <Prompt
                open={reset.pending}
                title={c('Action').t`Confirm reset`}
                buttons={[
                    <Button onClick={reset.confirm} color="danger" pill>
                        {c('Action').t`Confirm`}
                    </Button>,
                    <Button onClick={reset.cancel} pill>
                        {c('Action').t`Cancel`}
                    </Button>,
                ]}
            >
                <span>{c('Warning')
                    .t`This will create an unencrypted backup and reset the application to resolve the migration failure. You will need to import your data from the backup file after the reset completes. Delete the backup file once finished.`}</span>
            </Prompt>
        </div>
    );
};
