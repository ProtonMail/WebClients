import { type LogWriter, logger } from '@protontech/logger';

import { getUrlMeetingLinkName } from './getUrlMeetingLinkName';

const getMeetingLinkNameFromUrl = () => {
    try {
        return getUrlMeetingLinkName();
    } catch {
        return '';
    }
};

const createMeetingLogWriter = (contexts: string[]): LogWriter => {
    const resolve = () => {
        const meetingLinkName = getMeetingLinkNameFromUrl();
        return contexts.reduce(
            (writer, context) => writer.withContext(context),
            meetingLinkName ? logger.withContext(meetingLinkName) : logger
        );
    };

    return {
        trace: (message, ...args) => resolve().trace(message, ...args),
        debug: (message, ...args) => resolve().debug(message, ...args),
        info: (message, ...args) => resolve().info(message, ...args),
        warn: (message, ...args) => resolve().warn(message, ...args),
        error: (message, ...args) => resolve().error(message, ...args),
        log: (message, ...args) => resolve().log(message, ...args),
        withContext: (context) => createMeetingLogWriter([...contexts, context]),
    };
};

export const meetingLogger = createMeetingLogWriter([]);
