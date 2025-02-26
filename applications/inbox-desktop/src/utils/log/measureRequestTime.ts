import { mainLogger } from ".";
import { appSession } from "../session";

export function measureRequestTime() {
    const electronSession = appSession();
    const requestStartTimestampMap = new Map<number, number>();
    let loadTimeList: number[] = [];

    electronSession.webRequest.onBeforeRequest((details, callback) => {
        if (["stylesheet", "script", "image", "font"].includes(details.resourceType)) {
            requestStartTimestampMap.set(details.id, performance.now());
        }
        callback({});
    });

    electronSession.webRequest.onCompleted((details) => {
        const startTimestamp = requestStartTimestampMap.get(details.id);
        if (startTimestamp) {
            requestStartTimestampMap.delete(details.id);
            loadTimeList.push(performance.now() - startTimestamp);
        }
    });

    setInterval(() => {
        if (loadTimeList.length === 0) {
            return;
        }

        const average = loadTimeList.reduce((a, b) => a + b, 0) / loadTimeList.length;
        const variance = loadTimeList.reduce((a, b) => a + Math.pow(b - average, 2), 0) / loadTimeList.length;
        const deviation = Math.sqrt(variance);

        mainLogger.debug(
            "request-load-time",
            `Average: ${Math.ceil(average)}ms`,
            `Deviation: ${Math.ceil(deviation)}ms`,
            `Max: ${Math.ceil(Math.max(...loadTimeList))}ms`,
            `Count: ${loadTimeList.length}`,
        );

        loadTimeList = [];
    }, 10000);
}
