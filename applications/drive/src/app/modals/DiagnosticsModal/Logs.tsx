import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Badge } from '@proton/components';

import { withHoc } from '../../hooks/withHoc';
import { type Log, useLogsState } from './useLogsState';

type Props = {
    logs: Log[];
    downloadLogs: () => void;
};

export const Logs = withHoc<{}, Props>(useLogsState, LogsView);

function LogsView({ logs, downloadLogs }: Props) {
    return (
        <>
            <Button onClick={downloadLogs} className="mb-4">{c('Action').t`Download logs`}</Button>
            <table>
                <thead>
                    <tr>
                        <th>{c('Title').t`Time`}</th>
                        <th>{c('Title').t`Level`}</th>
                        <th>{c('Title').t`Logger`}</th>
                        <th>{c('Title').t`Message`}</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.map((log) => (
                        <tr key={log.message + log.time.toISOString()}>
                            <td>{log.time.toLocaleTimeString()}</td>
                            <td>
                                <Badge type={getLevelColor(log.level)}>{log.level}</Badge>
                            </td>
                            <td>{log.logger}</td>
                            <td>
                                <pre>{log.message}</pre>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    );
}

function getLevelColor(level: string) {
    switch (level.toLowerCase()) {
        case 'error':
            return 'error';
        case 'warning':
            return 'warning';
        case 'info':
            return 'info';
        case 'debug':
            return 'light';
        default:
            return 'default';
    }
}
