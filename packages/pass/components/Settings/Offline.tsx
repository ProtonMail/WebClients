import { type FC } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import { Checkbox } from '@proton/components/index';
import { useActionRequest } from '@proton/pass/hooks/useActionRequest';
import { useAsyncModalHandles } from '@proton/pass/hooks/useAsyncModalHandles';
import { offlineDisable, offlineSetupIntent } from '@proton/pass/store/actions';
import { selectOfflineSupported } from '@proton/pass/store/selectors';
import { BRAND_NAME, PASS_APP_NAME } from '@proton/shared/lib/constants';

import { ConfirmPasswordModal } from '../Confirmation/ConfirmPasswordModal';
import { SettingsPanel } from './SettingsPanel';

export const Offline: FC = () => {
    const dispatch = useDispatch();
    const passwordConfirmModal = useAsyncModalHandles<string>();
    const supported = useSelector(selectOfflineSupported);
    const setup = useActionRequest({ action: offlineSetupIntent });

    const toggleOffline = async (enable: boolean) => {
        if (enable) {
            await passwordConfirmModal.handler({
                onSubmit: (password) => {
                    setup.dispatch(password);
                },
            });
        } else dispatch(offlineDisable());
    };

    return (
        <>
            <SettingsPanel title={c('Label').t`Offline mode`}>
                <Checkbox
                    checked={supported}
                    disabled={false}
                    loading={false}
                    onChange={(e) => toggleOffline(e.target.checked)}
                >
                    <span>
                        {c('Label').t`Enable offline access`}
                        <span className="block color-weak text-sm">
                            {c('Info')
                                .t`${PASS_APP_NAME} will require your ${BRAND_NAME} password in order to access data offline.`}
                        </span>
                    </span>
                </Checkbox>
                <ConfirmPasswordModal
                    message={c('Info').t`Please confirm your ${BRAND_NAME} password in order to enable offline mode`}
                    onSubmit={passwordConfirmModal.resolver}
                    onClose={passwordConfirmModal.abort}
                    {...passwordConfirmModal.state}
                />
            </SettingsPanel>
        </>
    );
};
