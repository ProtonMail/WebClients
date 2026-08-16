import { type FC, useCallback, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Checkbox from '@proton/components/components/input/Checkbox';
import { IcCross } from '@proton/icons/icons/IcCross';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { useCopyToClipboard } from '@proton/pass/components/Settings/Clipboard/ClipboardProvider';
import clsx from '@proton/utils/clsx';

/** A field eligible for multi-copy selection. `value` may be a getter for
 * lazily-resolved values (eg: OTP tokens which are computed on demand). */
export type MultiCopyField = {
    key: string;
    label: string;
    value: string | (() => string | Promise<string>);
};

export type MultiCopySeparator = 'comma' | 'newline';

export const MULTICOPY_SEPARATORS: Record<MultiCopySeparator, string> = {
    comma: ', ',
    newline: '\n',
};

export const useMultiCopy = (fields: MultiCopyField[]) => {
    const copyToClipboard = useCopyToClipboard();

    const [enabled, setEnabled] = useState(false);
    const [separator, setSeparator] = useState<MultiCopySeparator>('comma');
    const [selected, setSelected] = useState<Set<string>>(new Set());

    const toggleEnabled = useCallback(() => {
        setEnabled((prev) => {
            if (prev) setSelected(new Set());
            return !prev;
        });
    }, []);

    const toggleField = useCallback((key: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    }, []);

    const toggleSelectAll = useCallback(() => {
        setSelected((prev) => (prev.size === fields.length ? new Set() : new Set(fields.map(({ key }) => key))));
    }, [fields]);

    const setCommaSeparator = useCallback((comma: boolean) => setSeparator(comma ? 'comma' : 'newline'), []);

    const copySelected = useCallback(async () => {
        const parts = await Promise.all(
            fields
                .filter((field) => selected.has(field.key))
                .map(async (field) => {
                    const value = field.value instanceof Function ? await field.value() : field.value;
                    return value.length > 0 ? `${field.label}: ${value}` : null;
                })
        );

        const entries = parts.filter((part): part is string => part !== null);
        if (entries.length > 0) await copyToClipboard(entries.join(MULTICOPY_SEPARATORS[separator]));
    }, [copyToClipboard, fields, selected, separator]);

    return {
        copySelected,
        enabled,
        isSelected: (key: string) => selected.has(key),
        selectedCount: selected.size,
        separator,
        setCommaSeparator,
        toggleEnabled,
        toggleField,
        toggleSelectAll,
    };
};

type MultiCopyCheckboxProps = { checked: boolean; className?: string; onChange: () => void };

/** Selection checkbox rendered in place of the field icon. Clicks are
 * stopped from propagating so they don't trigger the row's click-to-copy. */
export const MultiCopyCheckbox: FC<MultiCopyCheckboxProps> = ({ checked, className, onChange }) => (
    <span
        className={clsx('flex justify-center items-center shrink-0', className)}
        onClick={(evt) => evt.stopPropagation()}
    >
        <Checkbox checked={checked} onChange={() => onChange()} />
    </span>
);

type MultiCopyToolbarProps = {
    commaSeparator: boolean;
    enabled: boolean;
    selectedCount: number;
    totalCount: number;
    onCopy: () => void;
    onToggleEnabled: () => void;
    onToggleSelectAll: () => void;
    onToggleSeparator: (comma: boolean) => void;
};

export const MultiCopyToolbar: FC<MultiCopyToolbarProps> = ({
    commaSeparator,
    enabled,
    selectedCount,
    totalCount,
    onCopy,
    onToggleEnabled,
    onToggleSelectAll,
    onToggleSeparator,
}) => {
    if (!enabled) {
        return (
            <FieldsetCluster mode="read" as="div">
                <div className="flex items-center px-4 py-2">
                    <Button shape="outline" size="small" className="w-full" onClick={onToggleEnabled}>
                        {c('Action').t`Select fields to copy`}
                    </Button>
                </div>
            </FieldsetCluster>
        );
    }

    return (
        <FieldsetCluster mode="read" as="div">
            <div className="flex flex-wrap items-center gap-2 px-4 py-2">
                <Checkbox checked={commaSeparator} onChange={(evt) => onToggleSeparator(evt.target.checked)}>
                    {
                        // translator: when unchecked, selected fields will be separated by line breaks instead
                        c('Label').t`Separate with comma and space`
                    }
                </Checkbox>
                <span className="ml-auto" />
                <Button shape="ghost" size="small" onClick={onToggleSelectAll}>
                    {selectedCount === totalCount ? c('Action').t`Deselect all` : c('Action').t`Select all`}
                </Button>
                <Button size="small" disabled={selectedCount === 0} onClick={onCopy}>
                    {c('Action').t`Copy`}
                </Button>
                <Button
                    icon
                    shape="ghost"
                    size="small"
                    title={c('Action').t`Cancel`}
                    aria-label={c('Action').t`Cancel`}
                    onClick={onToggleEnabled}
                >
                    <IcCross size={4} />
                </Button>
            </div>
        </FieldsetCluster>
    );
};
