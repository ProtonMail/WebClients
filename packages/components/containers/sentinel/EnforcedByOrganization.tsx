import type { ReactNode } from "react";
import { c } from "ttag";
import { Tooltip } from "@proton/atoms/Tooltip/Tooltip";

export const EnforcedByOrganization = ({enforced, children}: { enforced: boolean; children: ReactNode }) => {
    if (!enforced) {
        return children;
    }

    return (
        <Tooltip title={c('Tooltip').t`This setting is managed by your organization`} openDelay={0}>
            <span>{children}</span>
        </Tooltip>
    );
};
