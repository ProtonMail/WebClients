import type { ReactNode } from 'react';
import { useMemo, useRef } from 'react';
import { useHistory } from 'react-router-dom';

import LumoAgentDrawerContext from '@proton/components/components/drawer/views/lumoAgent/lumoAgentDrawerContext';
import useLumoAgent from '@proton/components/components/lumoAgent/useLumoAgent';
import { useFolders, useLabels } from '@proton/mail/store/labels/hooks';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';

import { useApplyLocation } from 'proton-mail/hooks/actions/applyLocation/useApplyLocation';
import { useMailStore } from 'proton-mail/store/hooks';

import { buildLumoMailConfig } from '../registry';
import type { MailToolDeps } from '../toolModule';

interface Props {
    children: ReactNode;
}

/**
 * Stands up the Lumo assistant for Mail. It builds the Mail tool pack's config from the store/router
 * hooks and hands it to {@link useLumoAgent}, then exposes the conversation to {@link DrawerLumoView}
 * via context. Mounted above the drawer (see PrivateLayout) so the conversation persists across drawer
 * tab switches and panel open/close, and only when the `LumoInMail` flag is on — flag off, this
 * component is never rendered.
 */
const LumoMailProvider = ({ children }: Props) => {
    const store = useMailStore();
    const history = useHistory();
    const { applyLocation } = useApplyLocation();
    const [folders = []] = useFolders();
    const [labels = []] = useLabels();
    const [mailSettings] = useMailSettings();

    // Latest values, refreshed every render, so the once-built handlers always read the current
    // snapshot (mirrors the POC's ref pattern; keeps the config referentially stable).
    const latest = useRef({ store, history, applyLocation, folders, labels, mailSettings });
    latest.current = { store, history, applyLocation, folders, labels, mailSettings };

    // Built once: deps read through getters/methods off `latest`, so config identity never changes and
    // useLumoAgent keeps the same executor/session across renders.
    const config = useMemo(() => {
        const deps: MailToolDeps = {
            get store() {
                return latest.current.store;
            },
            get history() {
                return latest.current.history;
            },
            getFolders: () => latest.current.folders,
            getLabels: () => latest.current.labels,
            getMailSettings: () => latest.current.mailSettings,
            applyLocation: (params) => latest.current.applyLocation(params),
        };
        return buildLumoMailConfig(deps);
    }, []);

    const conversation = useLumoAgent(config);

    return (
        <LumoAgentDrawerContext.Provider value={{ ...conversation, cardRenderers: config.cardRenderers }}>
            {children}
        </LumoAgentDrawerContext.Provider>
    );
};

export default LumoMailProvider;
