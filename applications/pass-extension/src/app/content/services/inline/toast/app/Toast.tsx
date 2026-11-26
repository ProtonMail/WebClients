import { type FC, useCallback, useEffect, useState } from 'react';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import NotificationsChildren from '@proton/components/containers/notifications/Children';
import { useAppState } from '@proton/pass/components/Core/AppStateProvider';
import { Localized } from '@proton/pass/components/Core/Localized';
import { clientBusy } from '@proton/pass/lib/client';
import type { MaybeNull } from '@proton/pass/types/utils';

import { useIFrameAppState, useRegisterMessageHandler } from '../../../../../../lib/components/Inline/IFrameApp';
import { IFrameAppAutoSizer } from '../../../../../../lib/components/Inline/IFrameAppAutoSizer';
import { InlineToastAction } from '../../../../constants.runtime';
import { InlinePortMessageType } from '../../inline.messages';
import type { InlineToastRequest } from '../toast.app';
import { AutofillOTP } from './views/AutofillOTP';
import { Autosave } from './views/Autosave';
import { OfflineSetup } from './views/OfflineSetup';
import { PasskeyCreate } from './views/PasskeyCreate';
import { PasskeyGet } from './views/PasskeyGet';
import { ToastView } from './views/Toast';

import './Toast.scss';

type Props = {
    /** @internal Only used for debugging component */
    initial?: InlineToastRequest;
};

export const Toast: FC<Props> = ({ initial = null }) => {
    const { visible } = useIFrameAppState();
    const { status } = useAppState();

    const [state, setState] = useState<MaybeNull<InlineToastRequest>>(initial);
    const loading = state === null || clientBusy(status);

    useRegisterMessageHandler(
        InlinePortMessageType.TOAST_ACTION,
        useCallback(({ payload }) => setState(payload), [])
    );

    useEffect(() => setState((prev) => (visible ? prev : null)), [visible]);

    return (
        <IFrameAppAutoSizer className="bg-norm relative" style={{ '--anime-delay': '0s' }}>
            <Localized>
                <div className="h-full p-4">
                    {(() => {
                        if (loading) return <CircleLoader className="absolute inset-center m-auto" />;

                        switch (state.action) {
                            case InlineToastAction.AUTOSAVE:
                                return <Autosave {...state} />;
                            case InlineToastAction.OFFLINE_SETUP:
                                return <OfflineSetup {...state} />;
                            case InlineToastAction.OTP:
                                return <AutofillOTP {...state} />;
                            case InlineToastAction.PASSKEY_CREATE:
                                return <PasskeyCreate {...state} />;
                            case InlineToastAction.PASSKEY_GET:
                                return <PasskeyGet {...state} />;
                            case InlineToastAction.TOAST:
                                return <ToastView {...state} />;
                        }
                    })()}

                    <NotificationsChildren />
                </div>
            </Localized>
        </IFrameAppAutoSizer>
    );
};
