import { c } from 'ttag';

import TextFieldBody from '@proton/components/components/lumoAgent/cardBodies/TextFieldBody';
import type { CardBodyProps, CardRenderer } from '@proton/components/components/lumoAgent/types';
import type { ActionRequest } from '@proton/llm/lib/lumoAgent/contracts/types';

/**
 * Every editable param of the filter tools. Each carries the user's own words, so each must reach
 * `freeTextParams`: the hallucination guard matches a WHOLE param value against `<kind>-<6 base36>`, and
 * would reject a filter named "e-ticket" as an unknown reference.
 */
export enum FilterField {
    NAME = 'name',
    SIEVE = 'sieve',
}

const filterFieldText = (params: Record<string, any>, field: FilterField): string => String(params[field] ?? '');

/** An emptied field would send a nameless or scriptless filter the backend rejects. */
export const hasEveryFilterFieldFilled = (params: Record<string, any>): boolean =>
    Object.values(FilterField).every((field) => filterFieldText(params, field).trim().length > 0);

/** Serves as both the card's subtitle and the settled tile's detail; empty reads better as absent. */
export const proposedFilterName = (action: ActionRequest): string | undefined =>
    filterFieldText(action, FilterField.NAME) || undefined;

const SIEVE_FIELD_ROWS = 10;

const renderField = ({ params, onChange }: CardBodyProps, field: FilterField, label: string, rows?: number) => (
    <TextFieldBody
        label={label}
        value={filterFieldText(params, field)}
        onChange={(value) => onChange({ ...params, [field]: value })}
        rows={rows}
    />
);

export const renderFilterFields: NonNullable<CardRenderer['renderBody']> = (props) => (
    <>
        {renderField(props, FilterField.NAME, c('Label').t`Filter name`)}
        {renderField(props, FilterField.SIEVE, c('Label').t`Sieve script`, SIEVE_FIELD_ROWS)}
    </>
);
