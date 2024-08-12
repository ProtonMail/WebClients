import { useEffect, useRef } from 'react';
import { Route, Switch } from 'react-router-dom';

import { c } from 'ttag';

import { restoreSecurityCheckupSession, securityCheckupSlice } from '@proton/account';
import { useApi, useAppTitle, useUser } from '@proton/components';
import { lockSensitiveSettings } from '@proton/shared/lib/api/user';
import { SECURITY_CHECKUP_PATHS } from '@proton/shared/lib/constants';

import { useAccountDispatch } from '../../store/hooks';
import SecurityCheckupLayout from './components/SecurityCheckupLayout';
import SecurityCheckupRoot from './routes/SecurityCheckupRoot';
import EnableDeviceRecoveryContainer from './routes/device/EnableDeviceRecoveryContainer';
import EnableEmailContainer from './routes/email/EnableEmailContainer';
import SetEmailContainer from './routes/email/SetEmailContainer';
import VerifyEmailContainer from './routes/email/VerifyEmailContainer';
import EnablePhoneContainer from './routes/phone/EnablePhoneContainer';
import SetPhoneContainer from './routes/phone/SetPhoneContainer';
import VerifyPhoneContainer from './routes/phone/VerifyPhoneContainer';
import DownloadPhraseContainer from './routes/phrase/DownloadPhraseContainer';

const SecurityCheckupRouter = () => {
    const api = useApi();
    const dispatch = useAccountDispatch();
    const [user] = useUser();

    const pageLoadOnceRef = useRef(false);

    useAppTitle(c('l10n_nightly: Security checkup').t`Safety review`);

    useEffect(() => {
        restoreSecurityCheckupSession({ dispatch, userId: user.ID });

        return () => {
            dispatch(securityCheckupSlice.actions.clearSession());
        };
    }, [user.ID]);

    useEffect(() => {
        return () => {
            void api(lockSensitiveSettings());
        };
    }, []);

    return (
        <Switch>
            <Route exact path={SECURITY_CHECKUP_PATHS.SET_PHRASE}>
                <SecurityCheckupLayout>
                    <DownloadPhraseContainer />
                </SecurityCheckupLayout>
            </Route>

            <Route exact path={SECURITY_CHECKUP_PATHS.SET_EMAIL}>
                <SecurityCheckupLayout>
                    <SetEmailContainer />
                </SecurityCheckupLayout>
            </Route>
            <Route exact path={SECURITY_CHECKUP_PATHS.VERIFY_EMAIL}>
                <SecurityCheckupLayout>
                    <VerifyEmailContainer />
                </SecurityCheckupLayout>
            </Route>
            <Route exact path={SECURITY_CHECKUP_PATHS.ENABLE_EMAIL}>
                <SecurityCheckupLayout>
                    <EnableEmailContainer />
                </SecurityCheckupLayout>
            </Route>

            <Route exact path={SECURITY_CHECKUP_PATHS.SET_PHONE}>
                <SecurityCheckupLayout>
                    <SetPhoneContainer />
                </SecurityCheckupLayout>
            </Route>
            <Route exact path={SECURITY_CHECKUP_PATHS.VERIFY_PHONE}>
                <SecurityCheckupLayout>
                    <VerifyPhoneContainer />
                </SecurityCheckupLayout>
            </Route>
            <Route exact path={SECURITY_CHECKUP_PATHS.ENABLE_PHONE}>
                <SecurityCheckupLayout>
                    <EnablePhoneContainer />
                </SecurityCheckupLayout>
            </Route>

            <Route exact path={SECURITY_CHECKUP_PATHS.ENABLE_DEVICE_RECOVERY}>
                <SecurityCheckupLayout>
                    <EnableDeviceRecoveryContainer />
                </SecurityCheckupLayout>
            </Route>

            <Route path="*">
                <SecurityCheckupLayout>
                    <SecurityCheckupRoot pageLoadOnceRef={pageLoadOnceRef} />
                </SecurityCheckupLayout>
            </Route>
        </Switch>
    );
};

export default SecurityCheckupRouter;
