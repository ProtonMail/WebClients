import ConfirmCard from '@proton/components/components/lumoAgent/cardRenderers';
import type { CardRenderer } from '@proton/components/components/lumoAgent/types';
import { IcShield } from '@proton/icons/icons/IcShield';
import { ToolCallCard } from '@proton/lumo-ui';

import { useDesktopToolApprovals } from './useDesktopToolApprovals';

const DesktopApprovalCards = () => {
    const { approvals, approve, reject } = useDesktopToolApprovals();

    if (approvals.length === 0) {
        return null;
    }

    return (
        <div className="lumo-tool-approvals flex flex-column flex-nowrap gap-3 px-6 md:px-0 pb-2">
            {approvals.map((approval) => {
                const renderer: CardRenderer = {
                    icon: IcShield,
                    title: () => approval.toolLabel,
                    subtitle: () => approval.connectorName,
                    renderBody: () => <ToolCallCard args={approval.input} />,
                };
                return (
                    <ConfirmCard
                        key={approval.requestId}
                        renderer={renderer}
                        action={{ type: approval.toolName }}
                        labels={{}}
                        onApply={() => approve(approval.requestId)}
                        onCancel={() => reject(approval.requestId)}
                    />
                );
            })}
        </div>
    );
};

export default DesktopApprovalCards;
