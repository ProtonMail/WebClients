import { useState } from 'react';

import { clsx } from 'clsx';
import { c, msgid } from 'ttag';

import { Banner, BannerVariants } from '@proton/atoms/Banner/Banner';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import Checkbox from '@proton/components/components/input/Checkbox';
import { IcShield } from '@proton/icons/icons/IcShield';
import ConfirmCard from '@proton/llm/lib/lumoAgent/ui/cardRenderers';
import type { CardRenderer } from '@proton/llm/lib/lumoAgent/ui/types';
import type { DesktopToolApprovalReason } from '@proton/lumo-api-client/core/desktop-tools';
import { openDesktopSettings } from '@proton/lumo-api-client/core/desktop-tools';
import ToolCallCard from '@proton/lumo-ui/shared-components/ToolCallCard/ToolCallCard';
import sentenceValue from '@proton/lumo-ui/shared-components/sentenceValue/sentenceValue';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { localeCode } from '@proton/shared/lib/i18n';
import { getIntlLocale } from '@proton/shared/lib/i18n/helper';

import '@proton/lumo-ui/styles/lumo-ui.scss';

import './DesktopApprovalCards.scss';
import { useDesktopToolApprovals } from './useDesktopToolApprovals';

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
        case 'service':
            // translator: one item in "This conversation has read emails, web pages…"; content from apps like Slack or Jira that other people can write
            return c('Info').t`messages and documents from connected apps`;
        case 'connector':
            // translator: one item in "This conversation has read emails, web pages…"; the descriptions an MCP server the user added themselves gives of its tools
            return c('Info').t`tool descriptions from a connector you added`;
        default:
            // A newer desktop build may send a source this build doesn't know; it reads as generic wording.
            source satisfies never;
            return undefined;
    }
};

export const reasonText = ({ kind, sources, destination }: DesktopToolApprovalReason) => {
    if (kind === 'hidden_text') {
        // translator: shown before approving a tool call whose arguments contain invisible Unicode characters, displayed below as codes like [U+E0041]
        return c('Info')
            .t`This request contains invisible characters, shown below as codes like [U+200B]. They can hide data being sent out. Only approve if you expected them.`;
    }
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

const DesktopApprovalCards = ({ conversationId }: { conversationId: string | undefined }) => {
    const { approvals, approve, reject } = useDesktopToolApprovals(conversationId);
    const [always, setAlways] = useState<ReadonlySet<string>>(new Set());
    const toggleAlways = (requestId: string, checked: boolean) =>
        setAlways((prev) => {
            const next = new Set(prev);
            if (checked) {
                next.add(requestId);
            } else {
                next.delete(requestId);
            }
            return next;
        });

    const [approval] = approvals;

    if (!approval) {
        return null;
    }

    // Requests are answered one at a time; the rest show as cards stacked behind this one.
    const waiting = approvals.length - 1;

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
                    approval.reason?.kind === 'untrusted_write' ||
                    approval.reason?.kind === 'hidden_text') && (
                    <Banner className="mb-2 text-break" variant={BannerVariants.WARNING}>
                        {reasonText(approval.reason)}
                    </Banner>
                )}
                <ToolCallCard args={approval.input} />
                {!approval.reason && (
                    <Checkbox
                        className="mt-2 lumo-body-medium"
                        checked={always.has(approval.requestId)}
                        onChange={(event) => toggleAlways(approval.requestId, event.target.checked)}
                    >
                        {
                            // translator: checkbox on a tool approval card
                            c('Action').t`Don't ask again for this tool`
                        }
                    </Checkbox>
                )}
                {(approval.reason?.kind === 'untrusted_content' || approval.reason?.kind === 'untrusted_write') && (
                    <InlineLinkButton
                        className="mt-2 lumo-body-medium"
                        onClick={() => openDesktopSettings('connectors', approval.connectorId)}
                    >
                        {
                            // translator: link on a tool approval card shown after the conversation read emails, web pages or similar; opens settings where the tool can be allowed to run without asking even then
                            c('Action').t`Always allow this tool in Settings`
                        }
                    </InlineLinkButton>
                )}
            </>
        ),
    };

    return (
        <div className="desktop-approval-cards w-full px-1.5">
            <div
                className={clsx(
                    'desktop-approval-cards__stack',
                    waiting > 0 && 'desktop-approval-cards__stack--depth-2',
                    waiting > 1 && 'desktop-approval-cards__stack--depth-3',
                    waiting > 1 ? 'mb-3' : waiting > 0 && 'mb-1.5'
                )}
            >
                <ConfirmCard
                    key={approval.requestId}
                    renderer={renderer}
                    action={{ type: approval.toolName }}
                    labels={{}}
                    onApply={() => approve(approval.requestId, !approval.reason && always.has(approval.requestId))}
                    onCancel={() => reject(approval.requestId)}
                />
            </div>
            {/* Mounted with the card so screen readers announce changes to the count. */}
            <span className="sr-only" aria-live="polite">
                {waiting > 0 &&
                    // translator: screen reader text below a tool approval card when more tool calls are waiting for approval after it
                    c('Info').ngettext(
                        msgid`${waiting} more approval waiting`,
                        `${waiting} more approvals waiting`,
                        waiting
                    )}
            </span>
        </div>
    );
};

export default DesktopApprovalCards;
