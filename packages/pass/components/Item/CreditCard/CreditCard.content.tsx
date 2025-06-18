import { type FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { ExtraFieldsControl } from '@proton/pass/components/Form/Field/Control/ExtraFieldsControl';
import { MaskedValueControl } from '@proton/pass/components/Form/Field/Control/MaskedValueControl';
import { ObfuscatedValueControl } from '@proton/pass/components/Form/Field/Control/ObfuscatedValueControl';
import { UpgradeControl } from '@proton/pass/components/Form/Field/Control/UpgradeControl';
import { ValueControl } from '@proton/pass/components/Form/Field/Control/ValueControl';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import {
    cardNumberHiddenValue,
    cardNumberMask,
    expDateMask,
} from '@proton/pass/components/Form/Field/masks/credit-card';
import { TextAreaReadonly } from '@proton/pass/components/Form/legacy/TextAreaReadonly';
import type { ItemContentProps } from '@proton/pass/components/Views/types';
import { UpsellRef } from '@proton/pass/constants';
import { usePartialDeobfuscatedItem } from '@proton/pass/hooks/useDeobfuscatedItem';
import { selectPassPlan } from '@proton/pass/store/selectors';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { deobfuscateCCField } from '@proton/pass/utils/obfuscate/xor';
import { formatExpirationDateMMYY } from '@proton/pass/utils/time/expiration-date';

export const CreditCardContent: FC<ItemContentProps<'creditCard'>> = ({ secureLinkItem, revision }) => {
    const { data: item, itemId, shareId } = revision;

    const {
        metadata: { note },
        content: { cardholderName, expirationDate, number, verificationNumber, pin },
        extraFields,
    } = usePartialDeobfuscatedItem(item);

    const isFreePlan = useSelector(selectPassPlan) === UserPassPlan.FREE;
    const upsell = isFreePlan && !secureLinkItem;

    return (
        <>
            <FieldsetCluster mode="read" as="div">
                <ValueControl clickToCopy icon="user" label={c('Label').t`Name on card`} value={cardholderName} />
                {upsell ? (
                    <UpgradeControl
                        icon="credit-card"
                        label={c('Label').t`Card number`}
                        upsellRef={UpsellRef.LIMIT_CC}
                    />
                ) : (
                    <ObfuscatedValueControl
                        clickToCopy
                        hidden
                        hiddenValue={cardNumberHiddenValue}
                        icon="credit-card"
                        label={c('Label').t`Card number`}
                        mask={cardNumberMask}
                        value={number}
                        deobfuscate={deobfuscateCCField}
                    />
                )}

                <MaskedValueControl
                    clickToCopy
                    icon="calendar-today"
                    label={c('Label').t`Expiration date`}
                    mask={expDateMask}
                    value={formatExpirationDateMMYY(expirationDate)}
                />

                <ObfuscatedValueControl
                    clickToCopy
                    hidden
                    hiddenValue="••••"
                    icon="shield"
                    label={c('Label').t`Security code`}
                    value={verificationNumber}
                    deobfuscate={deobfuscateCCField}
                />

                <ObfuscatedValueControl
                    hidden
                    hiddenValue="••••"
                    icon="grid-3"
                    label={c('Label').t`PIN`}
                    value={pin}
                    deobfuscate={deobfuscateCCField}
                />
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

            {Boolean(extraFields.length) && (
                <ExtraFieldsControl extraFields={extraFields} itemId={itemId} shareId={shareId} />
            )}
        </>
    );
};
