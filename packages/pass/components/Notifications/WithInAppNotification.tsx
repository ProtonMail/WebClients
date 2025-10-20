import { type ComponentType, type FC, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { getLocalPath, getPassWebUrl } from '@proton/pass/components/Navigation/routing';
import { UpsellRef } from '@proton/pass/constants';
import { useNavigateToUpgrade } from '@proton/pass/hooks/useNavigateToUpgrade';
import { usePassConfig } from '@proton/pass/hooks/usePassConfig';
import { useTelemetryEvent } from '@proton/pass/hooks/useTelemetryEvent';
import { updateInAppNotificationState } from '@proton/pass/store/actions';
import { InAppNotificationCtaType, InAppNotificationState } from '@proton/pass/types';
import type { InAppNotification, TelemetryInAppNotificationStatus } from '@proton/pass/types/data/notification';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';

export type InAppNotificationRenderProps = {
    notification: InAppNotification;
    dense?: boolean;
};

interface InAppNotificationHandles {
    setNotificationState: (state: InAppNotificationState) => void;
    onAction: (state?: InAppNotificationState) => void;
}

const TelemetryStatusName: Record<InAppNotificationState, TelemetryInAppNotificationStatus> = {
    [InAppNotificationState.READ]: 'read',
    [InAppNotificationState.UNREAD]: 'unread',
    [InAppNotificationState.DISMISSED]: 'dismissed',
};

export const WithInAppNotification = <P extends InAppNotificationRenderProps>(
    Component: ComponentType<InAppNotificationHandles & P>
): FC<P> => {
    const WrappedComponent: FC<P> = (props) => {
        const { onLink, onTelemetry } = usePassCore();
        const { API_URL } = usePassConfig();
        const dispatch = useDispatch();
        const history = useHistory();

        const { id, notificationKey, content } = props.notification;
        const upgrade = useNavigateToUpgrade({ upsellRef: UpsellRef.DEFAULT });

        useTelemetryEvent(TelemetryEventName.PassNotificationDisplay, {}, { notificationKey })([]);

        const handles = useMemo<InAppNotificationHandles>(
            () => ({
                setNotificationState: (state) => {
                    dispatch(updateInAppNotificationState.intent({ id, state }));
                    onTelemetry(
                        TelemetryEventName.PassNotificationChangeStatus,
                        {},
                        { notificationKey, notificationStatus: TelemetryStatusName[state] }
                    );
                },

                onAction: (state = InAppNotificationState.READ) => {
                    if (content.cta) {
                        const { type, ref } = content.cta;
                        const subPath = ref.substring(1);

                        onTelemetry(TelemetryEventName.PassNotificationCTAClick, {}, { notificationKey });
                        handles.setNotificationState(state);

                        if (type === InAppNotificationCtaType.EXTERNAL_LINK) return onLink(ref);
                        else if (!EXTENSION_BUILD) return history.push(getLocalPath(subPath));
                        else {
                            /** Avoid redirecting to web-app for extension upgrades */
                            const isUpgrade = subPath.includes('internal/upgrade');
                            const params = new URLSearchParams(subPath.split('?')?.[1] ?? '');
                            const coupon = isUpgrade ? params.get('Coupon') : null;
                            return isUpgrade ? upgrade({ coupon }) : onLink(getPassWebUrl(API_URL, subPath));
                        }
                    }
                },
            }),
            [props.notification]
        );

        return <Component {...props} {...handles} />;
    };

    WrappedComponent.displayName = `WithInAppNotification<${Component.displayName ?? 'Component'}>`;

    return WrappedComponent;
};
