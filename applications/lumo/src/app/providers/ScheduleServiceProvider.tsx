import { type ReactNode, useEffect, useMemo, useRef } from 'react';

import { addListener } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { signoutAction } from '@proton/account/authenticationService/authenticationListener';
import { useUser } from '@proton/account/user/hooks';
import { useApi } from '@proton/app-context/useApi';
import { useNotifications } from '@proton/app-context/useNotifications';
import useAuthentication from '@proton/components/hooks/useAuthentication';
import { showDesktopNotification } from '@proton/lumo-api-client/core/desktop-notifications';
import { getDesktopSchedulesApi } from '@proton/lumo-api-client/core/desktop-schedules';
import { createDesktopClientToolExecutor, getDesktopConnectors } from '@proton/lumo-api-client/core/desktop-tools';
import { getUIDApi } from '@proton/shared/lib/api/helpers/customConfig';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { useFlag } from '@proton/unleash/useFlag';

import { useLumoFlags } from '../hooks/useLumoFlags';
import { useLumoPlan } from '../hooks/useLumoPlan';
import { useMaxModelAvailability } from '../hooks/useMaxModelAvailability';
import { useLumoDispatch, useLumoSelector, useLumoStore } from '../redux/hooks';
import { selectMasterKeysBundle } from '../redux/selectors';
import { extraThunkArguments } from '../redux/thunk';
import { LumoApi } from '../remote/api';
import { AgentScheduleExecutor } from '../services/schedules/AgentScheduleExecutor';
import { ConversationScheduleRunRepository } from '../services/schedules/ConversationScheduleRunRepository';
import { ScheduleService } from '../services/schedules/ScheduleService';
import { ScheduleStorage } from '../services/schedules/ScheduleStorage';
import { SpaceScheduleSource } from '../services/schedules/SpaceScheduleSource';
import { attachScheduleDebug } from '../services/schedules/developmentDebug';
import { createScheduleConversationRunner } from '../services/schedules/runScheduleConversation';
import { type ScheduleExecutor, type ScheduleSource, isScheduleTaskSource } from '../services/schedules/types';

type ScheduleServiceProviderProps = {
    children: ReactNode;
    source?: ScheduleSource;
    executor?: ScheduleExecutor;
};

/** Enables scheduled execution for authenticated users with the schedules feature flag. */
export function ScheduleServiceProvider(props: ScheduleServiceProviderProps) {
    const enabled = useFlag('LumoSchedules');
    return enabled ? <EnabledScheduleServiceProvider {...props} /> : <>{props.children}</>;
}

/** Authenticated app lifetime, independent of routes. A task source enables real execution. */
function EnabledScheduleServiceProvider({ children, source, executor }: ScheduleServiceProviderProps) {
    const [user] = useUser();
    const api = useApi();
    const { createNotification } = useNotifications();
    const masterKeys = useLumoSelector(selectMasterKeysBundle);
    const hydrated = useLumoSelector((state) => state.initialization.reduxLoadedFromIdb);
    const store = useLumoStore();
    const authentication = useAuthentication();
    const dispatch = useLumoDispatch();
    const accountId = user?.ID;
    const uid = authentication.getUID();
    const currentAccount = useRef(accountId);
    currentAccount.current = accountId;
    const bridge = getDesktopSchedulesApi();
    const flags = useLumoFlags();
    const { hasLumoPlus } = useLumoPlan();
    const { isMaxAvailableByFlag } = useMaxModelAvailability();
    const generationOptions = useRef({ ...flags, hasLumoPlus, isMaxAvailable: isMaxAvailableByFlag });
    generationOptions.current = { ...flags, hasLumoPlus, isMaxAvailable: isMaxAvailableByFlag };
    const persistence = useMemo(() => {
        if (!bridge || !accountId || !uid || !masterKeys || !hydrated) return null;
        const storage = new ScheduleStorage(
            extraThunkArguments.dbApi,
            store,
            masterKeys,
            () => currentAccount.current === accountId && authentication.getUID() === uid,
            new LumoApi(uid)
        );
        const scheduleSource = new SpaceScheduleSource(accountId, storage);
        const results = new ConversationScheduleRunRepository(accountId, storage);
        return { source: scheduleSource, results, storage };
    }, [accountId, uid, authentication, bridge, masterKeys, hydrated, store]);
    const localSource = source ? null : (persistence?.source ?? null);
    const taskSource = source ?? localSource ?? undefined;
    const results = persistence?.results ?? null;
    const agentExecutor = useMemo(() => {
        if (!accountId || !uid || !results || !persistence || !isScheduleTaskSource(taskSource)) return undefined;
        return new AgentScheduleExecutor({
            accountId,
            runConversation: createScheduleConversationRunner({
                api: getUIDApi(uid, api),
                storage: persistence.storage,
                getOptions: () => generationOptions.current,
                createTools: createDesktopClientToolExecutor,
                getConnectors: getDesktopConnectors,
            }),
            tasks: taskSource,
            repository: results,
            onComplete: async (task) => {
                const name = task.name ?? c('collider_2025:Label').t`Scheduled task`;
                const text = c('collider_2025:Info').t`${name} completed.`;
                createNotification({ text });
                await showDesktopNotification({
                    title: LUMO_SHORT_APP_NAME,
                    body: text,
                });
            },
            isCurrentAccount: () => currentAccount.current === accountId && authentication.getUID() === uid,
        });
    }, [accountId, uid, api, authentication, taskSource, results, persistence, createNotification]);
    const service = useMemo(() => {
        if (!bridge || !accountId || !uid) return null;
        return new ScheduleService({
            accountId,
            bridge,
            source: taskSource,
            executor: executor ?? agentExecutor,
            isCurrentAccount: () => currentAccount.current === accountId && authentication.getUID() === uid,
        });
    }, [accountId, uid, authentication, bridge, taskSource, executor, agentExecutor]);

    useEffect(() => {
        if (!localSource) return;
        void localSource.load().catch(() => {
            /* Exposed through the local source snapshot. */
        });
        return localSource.dispose;
    }, [localSource]);

    useEffect(() => {
        if (!localSource || !service) return;
        return localSource.subscribe(() => {
            void service.refresh();
        });
    }, [localSource, service]);

    useEffect(() => {
        if (!service) return;
        // Stop as soon as signout is requested, before its network revocation/redirect finishes.
        const unsubscribe = dispatch(addListener({ actionCreator: signoutAction, effect: () => service.stop() }));
        const onPageHide = () => service.stop();
        const onPageShow = (event: PageTransitionEvent) => {
            if (event.persisted) void service.start();
        };
        window.addEventListener('pagehide', onPageHide);
        window.addEventListener('pageshow', onPageShow);
        void service.start();
        return () => {
            unsubscribe();
            window.removeEventListener('pagehide', onPageHide);
            window.removeEventListener('pageshow', onPageShow);
            service.stop();
        };
    }, [dispatch, service]);

    useEffect(() => {
        if (process.env.NODE_ENV !== 'development' || !service || !results) return;
        return attachScheduleDebug({
            service,
            results,
            isCurrentAccount: () => currentAccount.current === accountId && authentication.getUID() === uid,
        });
    }, [service, results, accountId, uid, authentication]);

    return <>{children}</>;
}
