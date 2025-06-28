import { format } from '@proton/shared/lib/date-fns-utc';

export const downloadLogs = (logs: string[]) => {
    if (logs.length === 0) {
        logs.push('No logs data');
    }
    const elm = document.createElement('a');
    const logData = logs.join('\n');
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
    elm.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(logData));
    elm.setAttribute('download', `proton-drive-${timestamp}.log`);
    elm.style.display = 'none';
    document.body.appendChild(elm);
    elm.click();
    document.body.removeChild(elm);
};
