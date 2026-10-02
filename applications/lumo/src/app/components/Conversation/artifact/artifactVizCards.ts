import type { LumoCardSpec } from '../../LumoMarkdown/card/cardTypes';
import { isCardLanguage, isCardRowLanguage } from '../../LumoMarkdown/card/detectCardSpec';
import { parseCardRowSegmentCode } from '../../LumoMarkdown/card/parseCardRowFence';
import { tryParseCardSpec } from '../../LumoMarkdown/card/parseCardSpec';
import { replaceCompleteMarkdownCodeFences } from '../../LumoMarkdown/vega/parseMarkdownCodeFence';

// Cards (```card-row / ```card) are a chat-only primitive (D12). When one leaks into an artifact, it
// is turned into plain content that keeps its data — a table or list for metrics, a quote for a
// finding — instead of showing as raw JSON. Done at read time: the stored artifact keeps what the
// model emitted.

/**
 * Parse an explicitly labelled card fence. Only `card` / `card-row` languages count: a ```json
 * block that happens to look like a card stays code in artifacts.
 */
export function parseArtifactCardFence(language: string, code: string): LumoCardSpec[] | null {
    if (!isCardLanguage(language)) {
        return null;
    }

    if (isCardRowLanguage(language) || code.trim().startsWith('[')) {
        const cards = (parseCardRowSegmentCode(code) ?? [])
            .map((fence) => {
                return tryParseCardSpec(fence.code);
            })
            .filter((card): card is LumoCardSpec => {
                return card !== null;
            });
        return cards.length > 0 ? cards : null;
    }

    const card = tryParseCardSpec(code);
    return card ? [card] : null;
}

function isMetric(card: LumoCardSpec): boolean {
    return card.type === 'metric';
}

function toTableCell(text: string | undefined): string {
    return (text ?? '').replace(/\r?\n/g, ' ').replace(/\|/g, '\\|');
}

/** Metrics → a Metric / Value / Change table; findings and summaries → one quote each. */
export function cardsToMarkdown(cards: LumoCardSpec[]): string {
    const parts: string[] = [];
    const metrics = cards.filter(isMetric);
    const others = cards.filter((card) => {
        return !isMetric(card);
    });

    if (metrics.length > 0) {
        const rows = metrics.map((card) => {
            return `| ${toTableCell(card.title)} | ${toTableCell(card.value)} | ${toTableCell(card.delta)} |`;
        });
        parts.push(['| Metric | Value | Change |', '| --- | --- | --- |', ...rows].join('\n'));
    }

    others.forEach((card) => {
        const body = card.body ? `: ${card.body.replace(/\r?\n/g, ' ')}` : '';
        parts.push(`> **${card.title}**${body}`);
    });

    return parts.join('\n\n');
}

/** Replace every complete card fence in document markdown with its plain-markdown form. */
export function normalizeDocumentCardFences(markdown: string): string {
    return replaceCompleteMarkdownCodeFences(markdown, (fence) => {
        const cards = parseArtifactCardFence(fence.language, fence.code);
        return cards ? cardsToMarkdown(cards) : null;
    });
}

/** Metrics → a list of "Title: value (change)"; findings and summaries → one quote each. */
export function cardsToSlideFragment(doc: Document, cards: LumoCardSpec[]): DocumentFragment {
    const fragment = doc.createDocumentFragment();
    const metrics = cards.filter(isMetric);

    if (metrics.length > 0) {
        const list = doc.createElement('ul');
        metrics.forEach((card) => {
            const item = doc.createElement('li');
            const title = doc.createElement('strong');
            title.textContent = card.title;
            item.appendChild(title);
            const value = card.value ? `: ${card.value}` : '';
            const delta = card.delta ? ` (${card.delta})` : '';
            item.appendChild(doc.createTextNode(`${value}${delta}`));
            list.appendChild(item);
        });
        fragment.appendChild(list);
    }

    cards
        .filter((card) => {
            return !isMetric(card);
        })
        .forEach((card) => {
            const quote = doc.createElement('blockquote');
            const title = doc.createElement('strong');
            title.textContent = card.title;
            quote.appendChild(title);
            if (card.body) {
                quote.appendChild(doc.createTextNode(`: ${card.body}`));
            }
            fragment.appendChild(quote);
        });

    return fragment;
}
