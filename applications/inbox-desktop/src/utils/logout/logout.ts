import { resetBadge } from "../../ipc/notification";
import telemetryService from "../telemetry";
import { resetHiddenViews } from "../view/viewManagement";

export function handleLogoutIPC() {
    resetHiddenViews();
    resetBadge();
    telemetryService.userLogout();
}
