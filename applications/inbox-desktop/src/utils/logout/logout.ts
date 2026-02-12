import { resetBadge } from "../../ipc/notification";
import telemetry from "../telemetry";
import { resetHiddenViews } from "../view/viewManagement";

export function handleLogoutIPC() {
    resetHiddenViews();
    resetBadge();
    telemetry.userLogout();
}
