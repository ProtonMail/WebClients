import { c } from 'ttag';

import { resumeImport } from '@proton/activation/src/api/api';
import { ApiImporterError, ApiImporterState } from '@proton/activation/src/api/api.interface';
import { getEasySwitchFeaturesFromProducts } from '@proton/activation/src/hooks/useOAuthPopup.helpers';
import { useTrackImportAction } from '@proton/activation/src/hooks/useTrackImportAction';
import { cancelImporter } from '@proton/activation/src/logic/importers/importers.actions';
import type { ActiveImporter, Importer } from '@proton/activation/src/logic/importers/importers.interface';
import { useEasySwitchDispatch } from '@proton/activation/src/logic/store';
import { useApi } from '@proton/app-context/useApi';
import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Prompt from '@proton/components/components/prompt/Prompt';
import useEventManager from '@proton/components/hooks/useEventManager';
import useLoading from '@proton/hooks/useLoading';
import { BRAND_NAME } from '@proton/shared/lib/constants';

interface Props {
    activeImporter: ActiveImporter;
    importer: Importer;
}

export const ImporterActions = ({ activeImporter, importer }: Props) => {
    const { localID, product, importState, errorCode } = activeImporter;
    const { ID, account, provider } = importer;

    const api = useApi();
    const dispatch = useEasySwitchDispatch();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const trackEvent = useTrackImportAction({ account, provider, product });

    const [loadingResume, withLoadingResume] = useLoading();
    const [loadingCancel, withLoadingCancel] = useLoading();
    const [cancelModalProps, showCancelModal, renderCancelModal] = useModalState();

    // Reconnecting after an authentication error needs a new OAuth token, which is not supported here yet
    const canResume =
        importState === ApiImporterState.PAUSED && errorCode !== ApiImporterError.ERROR_CODE_IMAP_CONNECTION;

    const handleResume = async () => {
        await api(resumeImport({ ImporterID: ID, Features: getEasySwitchFeaturesFromProducts([product]) }));
        await call();
        createNotification({ text: c('Success').t`Resuming import` });
        void trackEvent('resume_import');
    };

    const handleCancel = () => {
        void withLoadingCancel(dispatch(cancelImporter({ activeImporterID: localID })));
        void trackEvent('cancel_import');
        showCancelModal(false);
    };

    return (
        <div className="inline-flex gap-2">
            {canResume && (
                <Button
                    color="weak"
                    shape="solid"
                    pill
                    loading={loadingResume}
                    onClick={() => withLoadingResume(handleResume())}
                >
                    {c('Action').t`Resume`}
                </Button>
            )}
            <Button
                color="weak"
                shape="solid"
                pill
                loading={loadingCancel}
                disabled={importState === ApiImporterState.CANCELED}
                onClick={() => showCancelModal(true)}
            >
                {c('Action').t`Cancel`}
            </Button>

            {renderCancelModal && (
                <Prompt
                    {...cancelModalProps}
                    title={c('Confirm modal title').t`Import is incomplete!`}
                    buttons={[
                        <Button color="danger" onClick={handleCancel}>{c('Action').t`Cancel import`}</Button>,
                        <Button color="weak" onClick={() => showCancelModal(false)}>{c('Action').t`Continue`}</Button>,
                    ]}
                >
                    {c('Warning')
                        .t`If you cancel this import, you won't be able to resume it. ${BRAND_NAME} saved all progress in your account. Cancel anyway?`}
                </Prompt>
            )}
        </div>
    );
};
