import { type VFC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { MaskedValueControl } from '@proton/pass/components/Form/Field/Control/MaskedValueControl';
import { UpgradeControl } from '@proton/pass/components/Form/Field/Control/UpgradeControl';
import { ValueControl } from '@proton/pass/components/Form/Field/Control/ValueControl';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import {
    cardNumberHiddenValue,
    cardNumberMask,
    expDateMask,
} from '@proton/pass/components/Form/Field/masks/credit-card';
import { TextAreaReadonly } from '@proton/pass/components/Form/legacy/TextAreaReadonly';
import { ItemViewPanel } from '@proton/pass/components/Layout/Panel/ItemViewPanel';
import type { ItemViewProps } from '@proton/pass/components/Views/types';
import { UpsellRef } from '@proton/pass/constants';
import { useDeobfuscatedItem } from '@proton/pass/hooks/useDeobfuscatedItem';
import { selectPassPlan } from '@proton/pass/store/selectors';
import { UserPassPlan } from '@proton/pass/types/api/plan';

export const CreditCardView: VFC<ItemViewProps<'creditCard'>> = (itemViewProps) => {
    const { data: item } = itemViewProps.revision;

    const {
        metadata: { note },
        content: { cardholderName, expirationDate, number, verificationNumber, pin },
    } = useDeobfuscatedItem(item);

    const isFreePlan = useSelector(selectPassPlan) === UserPassPlan.FREE;

    return (
        <ItemViewPanel type="creditCard" {...itemViewProps}>
            <FieldsetCluster mode="read" as="div">
                <ValueControl clickToCopy icon="user" label={c('Label').t`Name on card`} value={cardholderName} />
                {isFreePlan ? (
                    <UpgradeControl
                        icon="credit-card"
                        label={c('Label').t`Card number`}
                        upsellRef={UpsellRef.LIMIT_CC}
                    />
                ) : (
                    <MaskedValueControl
                        clickToCopy
                        hidden
                        hiddenValue={cardNumberHiddenValue(number)}
                        icon="credit-card"
                        label={c('Label').t`Card number`}
                        mask={cardNumberMask(number)}
                        value={number}
                        clipboardValue={number}
                    />
                )}
                <MaskedValueControl
                    clickToCopy
                    icon="calendar-today"
                    label={c('Label').t`Expiration date`}
                    mask={expDateMask}
                    value={expirationDate}
                />
                <ValueControl
                    clickToCopy
                    hidden
                    hiddenValue="••••"
                    icon="shield"
                    label={c('Label').t`Security code`}
                    value={verificationNumber}
                />
                <ValueControl hidden hiddenValue="••••" icon="grid-3" label={c('Label').t`PIN`} value={pin} />
            </FieldsetCluster>

            {note && (
                <FieldsetCluster mode="read" as="div">
                    <ValueControl
                        clickToCopy
                        as={TextAreaReadonly}
                        icon="note"
                        label={c('Label').t`Note`}
                        value={note}
                    />
                </FieldsetCluster>
            )}
        </ItemViewPanel>
    );
};
