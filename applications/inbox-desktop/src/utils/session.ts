import { session } from "electron";

export const appSession = () => session.fromPartition("persist:app", { cache: false });
export const updateSession = () => session.fromPartition("persist:update", { cache: false });
