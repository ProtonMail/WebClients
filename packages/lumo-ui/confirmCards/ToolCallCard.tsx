function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isScalar(value: unknown): boolean {
    return !isPlainObject(value) && !Array.isArray(value);
}

function formatValue(value: unknown): string {
    if (typeof value === 'string') {
        return value;
    }
    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return String(value);
    }
}

const RawArgs = ({ args }: { args: unknown }) => {
    const text = formatValue(args);
    if (!text) {
        return null;
    }
    return <pre className="lumo-tool-call__raw m-0 p-2 rounded bg-weak text-xs text-pre-wrap text-break">{text}</pre>;
};

interface Props {
    /** The tool call's arguments. A flat object renders as a key/value list; anything else (nested
     *  object, array, or non-object) falls back to a formatted JSON blob. */
    args: unknown;
}

/**
 * Shared confirm-card body for a raw tool call: shows the call's arguments read-only, so the user
 * sees exactly what a tool would run with before allowing it. Reusable across products; used for
 * tools whose args are surfaced but not edited (e.g. Lumo Desktop connector tools). The tool/connector
 * name belongs in the shell's title/subtitle, so this body is just the arguments.
 */
const ToolCallCard = ({ args }: Props) => {
    if (args === undefined || args === null || args === '') {
        return null;
    }

    const entries = isPlainObject(args) ? Object.entries(args) : null;
    if (!entries) {
        return <RawArgs args={args} />;
    }
    if (entries.length === 0) {
        return null;
    }
    if (!entries.every(([, value]) => isScalar(value))) {
        return <RawArgs args={args} />;
    }

    return (
        <dl className="lumo-tool-call__args m-0 p-2 rounded bg-weak text-sm">
            {entries.map(([key, value]) => (
                <div key={key} className="mb-2">
                    <dt className="m-0 color-weak text-xs text-break">{key}</dt>
                    <dd className="m-0 text-break text-pre-wrap">{formatValue(value)}</dd>
                </div>
            ))}
        </dl>
    );
};

export default ToolCallCard;
