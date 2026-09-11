import { c } from 'ttag';

import { IcShield } from '@proton/icons/icons/IcShield';
import ConfirmCard from '@proton/llm/lib/lumoAgent/ui/cardRenderers';
import type { CardRenderer } from '@proton/llm/lib/lumoAgent/ui/types';
import { ToolCallCard, sentenceValue } from '@proton/lumo-ui';

import ChatContainerItem from '../../../../ChatContainerItem';
import { useDesktopToolApprovals } from './useDesktopToolApprovals';

import '@proton/lumo-ui/lumo-ui.scss';

const DesktopApprovalCards = () => {
    const { approvals, approve, reject } = useDesktopToolApprovals();

    if (approvals.length === 0) {
        return null;
    }

    return (
        <ChatContainerItem className="lumo-tool-approvals px-6 md:px-0 pb-2">
            <div className="flex flex-column flex-nowrap gap-3 w-full">
                {approvals.map((approval) => {
                    const renderer: CardRenderer = {
                        icon: IcShield,
                        sentence: () => {
                            const tool = sentenceValue(approval.toolLabel);
                            const connector = sentenceValue(approval.connectorName);

                            // translator: a desktop connector asking to run one of its tools, e.g. "Run Search files with Obsidian"
                            return c('Info').jt`Run ${tool} with ${connector}`;
                        },
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
        </ChatContainerItem>
    );
};

export default DesktopApprovalCards;
