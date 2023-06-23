import { type VFC } from 'react';

import { c } from 'ttag';

import type { ItemTypeViewProps } from '../../../../shared/items/types';
import { MaskedValueControl } from '../../../components/Field/Control/MaskedValueControl';
import { ValueControl } from '../../../components/Field/Control/ValueControl';
import { FieldsetCluster } from '../../../components/Field/Layout/FieldsetCluster';
import { cardNumberMask, expDateMask } from '../../../components/Field/masks/credit-card';
import { ItemViewPanel } from '../../../components/Panel/ItemViewPanel';

export const CreditCardView: VFC<ItemTypeViewProps<'creditCard'>> = ({ vault, revision, ...itemViewProps }) => {
    const { data: item } = revision;
    const {
        metadata: { name, note },
        content: { cardholderName, number, expirationDate, verificationNumber, pin },
    } = item;

    return (
        <ItemViewPanel type="creditCard" name={name} vault={vault} {...itemViewProps}>
            <FieldsetCluster mode="read" as="div">
                <ValueControl clickToCopy icon="user" label={c('Label').t`Cardholder name`} value={cardholderName} />
                <MaskedValueControl
                    clickToCopy
                    hidden
                    icon="credit-card"
                    label={c('Label').t`Card number`}
                    mask={cardNumberMask(number)}
                    value={number}
                />
                <MaskedValueControl
                    clickToCopy
                    icon="calendar-today"
                    label={c('Label').t`Expires on`}
                    mask={expDateMask}
                    value={expirationDate}
                />
                <ValueControl
                    clickToCopy
                    hidden
                    icon="shield"
                    label={c('Label').t`Verification number`}
                    value={verificationNumber}
                />
                <ValueControl hidden icon="grid-3" label={c('Label').t`PIN`} value={pin} />
            </FieldsetCluster>

            {note && (
                <FieldsetCluster mode="read" as="div">
                    <ValueControl clickToCopy as="pre" icon="note" label={c('Label').t`Note`} value={note} />
                </FieldsetCluster>
            )}
        </ItemViewPanel>
    );
};
