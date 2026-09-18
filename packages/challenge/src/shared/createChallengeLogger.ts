import type { ChallengeLog, ChallengeLogType } from './interface';

const MAX_LOGS = 20;

/** Collects the frame's lifecycle for the error report; the search params identify the attempt. */
export const createChallengeLogger = (src: string) => {
    const searchParams = new URL(src).searchParams.toString();
    const logs: ChallengeLog[] = [];

    const addLog = (text: string, data: unknown, type: ChallengeLogType) => {
        if (logs.length >= MAX_LOGS) {
            return;
        }
        const log: ChallengeLog = {
            type,
            text: `${new Date().toISOString()} ${text} ${searchParams}`,
        };
        // The sentry serializer doesn't like undefined values
        if (data) {
            log.data = data;
        }
        logs.push(log);
    };

    return { logs, addLog };
};
