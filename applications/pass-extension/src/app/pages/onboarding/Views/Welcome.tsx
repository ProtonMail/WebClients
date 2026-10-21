import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { useAppState } from '@proton/pass/components/Core/AppStateProvider';
import { useLobbyConnectivityBar } from '@proton/pass/components/Core/ConnectivityProvider';
import { PasswordConfirm } from '@proton/pass/components/Lock/PasswordConfirm';
import { Layout } from '@proton/pass/components/Onboarding/Layout/Layout';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { PasswordVerification } from '@proton/pass/lib/auth/password';
import { clientErrored, clientLocked, clientMissingScope, clientUnauthorized } from '@proton/pass/lib/client';
import { selectVisibleItems } from '@proton/pass/store/selectors/items';
import { selectCanCreateItems } from '@proton/pass/store/selectors/shares';
import { PassFeature } from '@proton/pass/types/api/features';
import noop from '@proton/utils/noop';

import { useExtensionClient } from '../../../../lib/components/Extension/ExtensionClient';
import { pageMessage, sendMessage } from '../../../../lib/message/send-message';
import { WorkerMessageType } from '../../../../types/messages';

const ITEMS_COUNT_THRESHOLD = 0;

const resumeLogin = () =>
    sendMessage(pageMessage({ type: WorkerMessageType.AUTH_INIT, options: { forceLock: false } })).catch(noop);

export const Welcome = () => {
    const history = useHistory();
    const { booted, status } = useAppState();
    const items = useSelector(selectVisibleItems);
    const canCreateItems = useSelector(selectCanCreateItems);
    const newOnboardingFlag = useFeatureFlag(PassFeature.PassNewOnboarding);
    const sessionLost = clientUnauthorized(status) || clientErrored(status);
    const { logout } = useExtensionClient();
    const connectivityBar = useLobbyConnectivityBar();

    const handleSignOut = () => logout({ soft: true });

    const signOutButton = (
        <Button pill shape="ghost" color="weak" className="w-full" onClick={handleSignOut}>
            {c('Action').t`Sign out`}
        </Button>
    );

    useEffect(() => {
        if (sessionLost) return history.replace('/thank-you');
        if (!booted) return;
        if (newOnboardingFlag && canCreateItems && items.length <= ITEMS_COUNT_THRESHOLD) {
            history.replace('/new-account');
        } else {
            history.replace('/thank-you');
        }
    }, [booted, sessionLost]);

    if (clientMissingScope(status)) {
        return (
            <Layout>
                <div className="flex p-14 w-full flex-column items-center gap-4">
                    <h3>{c('Info').t`Enter your extra password`}</h3>
                    <div className="w-full max-w-custom" style={{ '--max-w-custom': '25rem' }}>
                        <PasswordConfirm mode={PasswordVerification.EXTRA_PASSWORD} onSuccess={resumeLogin} />
                        <div className="mt-2">{signOutButton}</div>
                    </div>
                </div>
                {connectivityBar}
            </Layout>
        );
    }

    if (clientLocked(status)) {
        return (
            <Layout>
                <div className="flex p-14 w-full flex-column items-center gap-4">
                    <h3>{c('Info').t`Open the extension to unlock it`}</h3>
                    <CircleLoader size="large" className="color-primary" />
                    <em>{c('Info').t`Don’t close this tab`}</em>
                    <div className="w-full max-w-custom" style={{ '--max-w-custom': '25rem' }}>
                        {signOutButton}
                    </div>
                </div>
                {connectivityBar}
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="flex p-14 w-full flex-column items-center gap-4">
                <h3 className="">{c('Title').t`Starting the extension`}</h3>
                <CircleLoader size="large" className="color-primary" />
                <em>{c('Info').t`Don’t close this tab`}</em>
            </div>
        </Layout>
    );
};
