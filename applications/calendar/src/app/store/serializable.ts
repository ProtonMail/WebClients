export const calendarIgnoredActionPaths = [
    'payload.targetEvent.start',
    'payload.targetEvent.end',
    /^payload.targetEvent.data.eventReadResult.result\.[a-zA-Z0-9=_-]*\.encryptionData.sharedSessionKey.data/,
    'payload.targetEvent.data.eventRecurrence.localStart',
    'payload.targetEvent.data.eventRecurrence.localEnd',
];
