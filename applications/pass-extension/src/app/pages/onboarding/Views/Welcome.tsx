import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { useAppState } from '@proton/pass/components/Core/AppStateProvider';
import { PasswordConfirm } from '@proton/pass/components/Lock/PasswordConfirm';
import { Layout } from '@proton/pass/components/Onboarding/Layout/Layout';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { PasswordVerification } from '@proton/pass/lib/auth/password';
import { clientErrored, clientLocked, clientMissingScope, clientUnauthorized } from '@proton/pass/lib/client';
import { selectCanCreateItems, selectVisibleItems } from '@proton/pass/store/selectors';
import { PassFeature } from '@proton/pass/types/api/features';
import noop from '@proton/utils/noop';

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
                    </div>
                </div>
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
                </div>
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
