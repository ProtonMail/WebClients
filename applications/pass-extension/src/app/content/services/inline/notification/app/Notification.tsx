import { type FC, useCallback, useEffect, useState } from 'react';

import { NotificationAction } from 'proton-pass-extension/app/content/constants.runtime';
import { InlinePortMessageType } from 'proton-pass-extension/app/content/services/inline/inline.messages';
import type { NotificationRequest } from 'proton-pass-extension/app/content/services/inline/notification/notification.app';
import { useIFrameAppState, useRegisterMessageHandler } from 'proton-pass-extension/lib/components/Inline/IFrameApp';
import { IFrameAppAutoSizer } from 'proton-pass-extension/lib/components/Inline/IFrameAppAutoSizer';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import NotificationsChildren from '@proton/components/containers/notifications/Children';
import { useAppState } from '@proton/pass/components/Core/AppStateProvider';
import { Localized } from '@proton/pass/components/Core/Localized';
import { clientBusy } from '@proton/pass/lib/client';
import type { MaybeNull } from '@proton/pass/types/utils/index';

import { AutofillOTP } from './views/AutofillOTP';
import { Autosave } from './views/Autosave';
import { PasskeyCreate } from './views/PasskeyCreate';
import { PasskeyGet } from './views/PasskeyGet';

import './Notification.scss';

type Props = {
    /** @internal Only used for debugging component */
    initial?: NotificationRequest;
};

export const Notification: FC<Props> = ({ initial = null }) => {
    const { visible } = useIFrameAppState();
    const { status } = useAppState();

    const [state, setState] = useState<MaybeNull<NotificationRequest>>(initial);
    const loading = state === null || clientBusy(status);

    useRegisterMessageHandler(
        InlinePortMessageType.NOTIFICATION_ACTION,
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
            </Localized>
        </IFrameAppAutoSizer>
    );
};
