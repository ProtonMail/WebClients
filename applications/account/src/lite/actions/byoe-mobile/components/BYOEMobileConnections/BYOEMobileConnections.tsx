import { useEffect, useRef, useState } from 'react';

import { useBYOEAddresses } from '@proton/activation/src/hooks/useBYOEAddresses';
import { loadDashboard } from '@proton/activation/src/logic/actions';
import { useEasySwitchDispatch } from '@proton/activation/src/logic/store';

import { BYOEAddresses } from './BYOEAddresses';
import { BYOEImports } from './BYOEImports';
import { BYOEMobileConnectionsError } from './BYOEMobileConnectionsError';
import { DotWaveLoader } from './DotWaveLoader';

import './BYOEMobileConnections.scss';

// Avoids a flash of the loader when the data is already there
const MIN_LOADING_MS = 800;

type DashboardStatus = 'loading' | 'error' | 'success';

export const BYOEMobileConnections = () => {
    const [minimumElapsed, setMinimumElapsed] = useState(false);
    const [dashboardStatus, setDashboardStatus] = useState<DashboardStatus>('loading');

    const dispatch = useEasySwitchDispatch();
    const { loading: loadingAddresses } = useBYOEAddresses();

    // Latest request, used to ignore the outcome of a request that was aborted or replaced
    const requestRef = useRef<{ abort: () => void }>();

    // Loads the importers, reports and syncs and keep track of state for the loading indicator and the error
    const load = async () => {
        requestRef.current?.abort();
        setDashboardStatus('loading');

        const request = dispatch(loadDashboard());
        requestRef.current = request;

        let status: DashboardStatus = 'success';
        try {
            await request.unwrap();
        } catch {
            status = 'error';
        }

        if (requestRef.current === request) {
            setDashboardStatus(status);
        }
    };

    useEffect(() => {
        void load();
        return () => {
            requestRef.current?.abort();
            requestRef.current = undefined;
        };
    }, []);

    // Ensures the loading is displayed for a minimum of MIN_LOADING_MS
    useEffect(() => {
        const timeout = setTimeout(() => setMinimumElapsed(true), MIN_LOADING_MS);
        return () => clearTimeout(timeout);
    }, []);

    if (loadingAddresses || dashboardStatus === 'loading' || !minimumElapsed) {
        return <DotWaveLoader />;
    }

    if (dashboardStatus === 'error') {
        return <BYOEMobileConnectionsError onRetry={load} />;
    }

    return (
        <div className="byoe-mobile-connections-content">
            <BYOEAddresses />
            <BYOEImports />
        </div>
    );
};
