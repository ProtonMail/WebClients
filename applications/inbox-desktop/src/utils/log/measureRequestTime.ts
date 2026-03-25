import { mainLogger } from ".";
import { webRequestRouter } from "../electronSession/webRequestRouter";

export function measureRequestTime() {
    const requestStartTimestampMap = new Map<number, number>();
    let loadTimeList: number[] = [];

    webRequestRouter.onBeforeRequest((details) => {
        if (["stylesheet", "script", "image", "font"].includes(details.resourceType)) {
            requestStartTimestampMap.set(details.id, performance.now());
        }
    });

    webRequestRouter.onErrorOccurred((details) => {
        requestStartTimestampMap.delete(details.id);
    });

    webRequestRouter.onCompleted((details) => {
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
