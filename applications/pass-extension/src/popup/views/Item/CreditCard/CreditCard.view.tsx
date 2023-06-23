import { type VFC } from 'react';

import { c } from 'ttag';

import type { ItemTypeViewProps } from '../../../../shared/items/types';
import { ClickToCopyValueControl } from '../../../components/Field/Control/ClickToCopyValueControl';
import { ValueControl } from '../../../components/Field/Control/ValueControl';
import { FieldsetCluster } from '../../../components/Field/Layout/FieldsetCluster';
import { ItemViewPanel } from '../../../components/Panel/ItemViewPanel';

export const CreditCardView: VFC<ItemTypeViewProps<'creditCard'>> = ({ vault, revision, ...itemViewProps }) => {
    const { data: item } = revision;
    const { metadata } = item;
    const { name, note } = metadata;

    return (
        <ItemViewPanel type="creditCard" name={name} vault={vault} {...itemViewProps}>
            {note && (
                <FieldsetCluster mode="read" as="div">
                    <ClickToCopyValueControl value={note}>
                        <ValueControl interactive as="pre" icon="note" label={c('Label').t`Note`}>
                            {note}
                        </ValueControl>
                    </ClickToCopyValueControl>
                </FieldsetCluster>
            )}
        </ItemViewPanel>
    );
};
