import { type FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

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
import { formatExpirationDateMMYY } from '@proton/pass/lib/validation/credit-card';
import { selectPassPlan } from '@proton/pass/store/selectors';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { deobfuscate, deobfuscateCreditCard } from '@proton/pass/utils/obfuscate/xor';

export const CreditCardContent: FC<ItemContentProps<'creditCard'>> = ({ secureLinkItem, revision }) => {
    const { data: item } = revision;

    const {
        metadata: { note },
        content: { cardholderName, expirationDate, number, verificationNumber, pin },
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
                        deobfuscate={deobfuscateCreditCard}
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
                    deobfuscate={deobfuscate}
                />

                <ObfuscatedValueControl
                    hidden
                    hiddenValue="••••"
                    icon="grid-3"
                    label={c('Label').t`PIN`}
                    value={pin}
                    deobfuscate={deobfuscate}
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
        </>
    );
};
