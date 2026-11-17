import { c } from 'ttag';

import { IcShield } from '@proton/icons/icons/IcShield';
import ConfirmCard from '@proton/llm/lib/lumoAgent/ui/cardRenderers';
import type { CardRenderer } from '@proton/llm/lib/lumoAgent/ui/types';
import type { DesktopToolApprovalReason } from '@proton/lumo-api-client/core/desktop-tools';
import ToolCallCard from '@proton/lumo-ui/shared-components/ToolCallCard/ToolCallCard';
import sentenceValue from '@proton/lumo-ui/shared-components/sentenceValue/sentenceValue';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { localeCode } from '@proton/shared/lib/i18n';
import { getIntlLocale } from '@proton/shared/lib/i18n/helper';

import ChatContainerItem from '../../../../ChatContainerItem';
import { useDesktopToolApprovals } from './useDesktopToolApprovals';

import '@proton/lumo-ui/styles/lumo-ui.scss';

const sourceLabel = (source: DesktopToolApprovalReason['sources'][number]) => {
    switch (source) {
        case 'mail':
            // translator: one item in "This conversation has read emails, web pages…"
            return c('Info').t`emails`;
        case 'web':
            // translator: one item in "This conversation has read emails, web pages…"
            return c('Info').t`web pages`;
        case 'shell':
            // translator: one item in "This conversation has read emails, web pages…"
            return c('Info').t`command output`;
    }
};

const reasonText = ({ kind, sources, destination }: DesktopToolApprovalReason) => {
    const labels = (sources ?? []).map(sourceLabel).filter((label): label is string => !!label);
    const read = labels.length
        ? new Intl.ListFormat(getIntlLocale(localeCode), { type: 'conjunction' }).format(labels)
        : c('Info').t`content from outside sources`;
    if (kind === 'untrusted_write') {
        // translator: shown before approving a file change, e.g. "This conversation has read emails, which can contain hidden instructions. Approving lets it change files on your computer."
        return c('Info')
            .t`This conversation has read ${read}, which can contain hidden instructions. Approving lets it change files on your computer.`;
    }
    return destination
        ? // translator: shown before approving a tool call, e.g. "This conversation has read emails and web pages, which can contain hidden instructions. Approving may send data to evil.example."
          c('Info')
              .t`This conversation has read ${read}, which can contain hidden instructions. Approving may send data to ${destination}.`
        : // translator: shown before approving a tool call, e.g. "This conversation has read emails, which can contain hidden instructions. Approving may send data outside Lumo."
          c('Info')
              .t`This conversation has read ${read}, which can contain hidden instructions. Approving may send data outside ${LUMO_SHORT_APP_NAME}.`;
};

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
                        renderBody: () => (
                            <>
                                {(approval.reason?.kind === 'untrusted_content' ||
                                    approval.reason?.kind === 'untrusted_write') && (
                                    <p className="m-0 mb-2 text-sm color-warning text-break">
                                        {reasonText(approval.reason)}
                                    </p>
                                )}
                                <ToolCallCard args={approval.input} />
                            </>
                        ),
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
