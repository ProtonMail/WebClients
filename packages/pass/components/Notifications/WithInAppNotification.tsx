import { type ComponentType, type FC, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { getLocalPath, getPassWebUrl } from '@proton/pass/components/Navigation/routing';
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
    onAction: () => void;
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

                onAction: () => {
                    if (content.cta) {
                        const { type, ref } = content.cta;
                        const subPath = ref.substring(1);

                        onTelemetry(TelemetryEventName.PassNotificationCTAClick, {}, { notificationKey });
                        handles.setNotificationState(InAppNotificationState.READ);

                        if (type === InAppNotificationCtaType.EXTERNAL_LINK) return onLink(ref, { replace: true });
                        else if (EXTENSION_BUILD) return onLink(getPassWebUrl(API_URL, subPath));
                        else return history.push(getLocalPath(subPath));
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
