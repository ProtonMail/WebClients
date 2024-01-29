export type IPCMessage = { type: "updateNotification"; payload: number } | { type: "userLogout"; payload: undefined };

export type IPCMessageType = IPCMessage["type"];
export type IPCMessagePayload<T extends IPCMessageType> = Extract<IPCMessage, { type: T }>["payload"];
