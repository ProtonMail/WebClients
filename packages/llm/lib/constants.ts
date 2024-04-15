import {MINUTE, SECOND} from "@proton/shared/lib/constants";

export const UNLOAD_ASSISTANT_TIMEOUT = 15 * MINUTE;
export const RETRY_GENERATE_TIMEOUT = 5 * SECOND;

export const enum ASSISTANT_STATUS {
    NOT_LOADED,
    DOWNLOADING,
    DOWNLOADED,
    LOADING_GPU,
    READY,
    GENERATING,
}
