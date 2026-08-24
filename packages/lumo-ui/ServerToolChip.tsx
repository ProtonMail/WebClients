import { Href } from '@proton/atoms/Href/Href';

import Disclosure from './primitives/Disclosure';
import type { IconComponent } from './types';

export interface ServerToolSource {
    url: string;
    title: string;
}

interface Props {
    /** What the tool did this turn, e.g. "Searched the web" — the product supplies the wording. */
    label: string;
    /** The glyph that identifies the tool (globe, lightbulb…), supplied by the product. */
    icon: IconComponent;
    /** Cited pages, if any. With none the chip is a static marker; with some it becomes a disclosure. */
    sources?: ServerToolSource[];
    className?: string;
}

/** Bare hostname for display (drops a leading www.); falls back to the raw URL if it doesn't parse. */
const sourceDomain = (url: string): string => {
    try {
        return new URL(url).hostname.replace(/^www\./, '');
    } catch {
        return url;
    }
};

/**
 * A transparency marker shown when the assistant used a server-side tool this turn. With no sources it
 * is a plain one-line marker (icon + label); with sources it expands to list each cited page
 * (domain + title). Product-agnostic: the wording and icon are supplied by the caller.
 */
const ServerToolChip = ({ label, icon: Icon, sources = [], className }: Props) => {
    if (!sources.length) {
        return (
            <div className={`lumo-server-tool text-sm color-weak ${className ?? ''}`.trim()}>
                <Icon className="shrink-0" size={3} />
                <span className="text-ellipsis" title={label}>
                    {label}
                </span>
            </div>
        );
    }

    return (
        <Disclosure label={label} leading={<Icon className="shrink-0" size={3} />} className={className}>
            <ul className="lumo-server-tool__sources unstyled m-0 mt-2 flex flex-column flex-nowrap gap-2">
                {sources.map((source) => (
                    <li key={source.url}>
                        <Href href={source.url} className="lumo-server-tool__source color-norm">
                            <span
                                className="lumo-server-tool__source-domain block text-sm color-weak text-ellipsis"
                                title={sourceDomain(source.url)}
                            >
                                {sourceDomain(source.url)}
                            </span>
                            <span className="lumo-server-tool__source-title block text-ellipsis" title={source.title}>
                                {source.title}
                            </span>
                        </Href>
                    </li>
                ))}
            </ul>
        </Disclosure>
    );
};

export default ServerToolChip;
