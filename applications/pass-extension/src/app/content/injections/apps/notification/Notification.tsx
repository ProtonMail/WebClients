import { type FC, useEffect, useRef, useState } from 'react';

import {
    useIFrameContext,
    useRegisterMessageHandler,
} from 'proton-pass-extension/app/content/injections/apps/components/IFrameApp';
import type { NotificationActions } from 'proton-pass-extension/app/content/types';
import { IFramePortMessageType, NotificationAction } from 'proton-pass-extension/app/content/types';

import { CircleLoader } from '@proton/atoms';
import { NotificationsChildren } from '@proton/components';
import { useAppState } from '@proton/pass/components/Core/AppStateProvider';
import { Localized } from '@proton/pass/components/Core/Localized';
import { clientBusy } from '@proton/pass/lib/client';
import type { MaybeNull } from '@proton/pass/types';

import { AutofillOTP } from './views/AutofillOTP';
import { Autosave } from './views/Autosave';
import { PasskeyCreate } from './views/PasskeyCreate';
import { PasskeyGet } from './views/PasskeyGet';

import './Notification.scss';

export const Notification: FC = () => {
    const { visible, resize } = useIFrameContext();
    const app = useAppState();
    const ref = useRef<HTMLDivElement>(null);

    const [state, setState] = useState<MaybeNull<NotificationActions>>(null);
    const loading = state === null || clientBusy(app.state.status);

    useRegisterMessageHandler(IFramePortMessageType.NOTIFICATION_ACTION, ({ payload }) => setState(payload));

    useEffect(() => {
        if (!visible) setState(null);

        if (ref.current) {
            const obs = new ResizeObserver(([entry]) => resize(entry.contentRect.height));
            obs.observe(ref.current);
            return () => obs.disconnect();
        }
    }, [visible]);

    return (
        <Localized>
            <div className="min-h-full bg-norm relative" style={{ '--anime-delay': '0s' }} ref={ref}>
                <div className="h-full p-4">
                    {(() => {
                        if (loading) return <CircleLoader className="absolute inset-center m-auto" />;

                        switch (state.action) {
                            case NotificationAction.AUTOSAVE:
                                return <Autosave {...state} />;
                            case NotificationAction.OTP:
                                return <AutofillOTP {...state} />;
                            case NotificationAction.PASSKEY_CREATE:
                                return <PasskeyCreate {...state} />;
                            case NotificationAction.PASSKEY_GET:
                                return <PasskeyGet {...state} />;
                        }
                    })()}

                    <NotificationsChildren />
                </div>
            </div>
        </Localized>
    );
};
