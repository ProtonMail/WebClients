import { useIndexedDBConnectionMonitor } from '../hooks/useIndexedDBConnectionMonitor';

/**
 * Component that monitors IndexedDB connection status and displays notifications
 * when the connection is lost or restored. This component renders nothing but
 * sets up event listeners for connection events.
 */
export const IndexedDBConnectionMonitor = () => {
    useIndexedDBConnectionMonitor();
    return null;
};
