import type { FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { IcCalendarToday } from '@proton/icons/icons/IcCalendarToday';
import { IcCreditCard } from '@proton/icons/icons/IcCreditCard';
import { IcGrid3 } from '@proton/icons/icons/IcGrid3';
import { IcNote } from '@proton/icons/icons/IcNote';
import { IcShield } from '@proton/icons/icons/IcShield';
import { IcUser } from '@proton/icons/icons/IcUser';

import { UpsellRef } from '../../../constants';
import { usePartialDeobfuscatedItem } from '../../../hooks/useDeobfuscatedItem';
import { useFeatureFlag } from '../../../hooks/useFeatureFlag';
import { selectPassPlan } from '../../../store/selectors';
import { PassFeature } from '../../../types/api/features';
import { UserPassPlan } from '../../../types/api/plan';
import { deobfuscateCCField } from '../../../utils/obfuscate/xor';
import { formatExpirationDateMMYY } from '../../../utils/time/expiration-date';
import { ExtraFieldsControl } from '../../Form/Field/Control/ExtraFieldsControl';
import { MaskedValueControl } from '../../Form/Field/Control/MaskedValueControl';
import { ObfuscatedValueControl } from '../../Form/Field/Control/ObfuscatedValueControl';
import { UpgradeControl } from '../../Form/Field/Control/UpgradeControl';
import { ValueControl } from '../../Form/Field/Control/ValueControl';
import { FieldsetCluster } from '../../Form/Field/Layout/FieldsetCluster';
import { cardNumberHiddenValue, cardNumberMask, expDateMask } from '../../Form/Field/masks/credit-card';
import { TextAreaReadonly } from '../../Form/legacy/TextAreaReadonly';
import type { ItemContentProps } from '../../Views/types';

export const CreditCardContent: FC<ItemContentProps<'creditCard'>> = ({ secureLinkItem, revision }) => {
    const { data: item, itemId, shareId } = revision;

    const {
        metadata: { note },
        content: { cardholderName, expirationDate, number, verificationNumber, pin },
        extraFields,
    } = usePartialDeobfuscatedItem(item);

    const isFreePlan = useSelector(selectPassPlan) === UserPassPlan.FREE;
    const freeCcFlag = useFeatureFlag(PassFeature.PassAllowCreditCardFreeUsers);
    const upsell = !freeCcFlag && isFreePlan && !secureLinkItem;

    return (
        <>
            <FieldsetCluster mode="read" as="div">
                <ValueControl clickToCopy icon={IcUser} label={c('Label').t`Name on card`} value={cardholderName} />

                {upsell ? (
                    <UpgradeControl
                        icon={IcCreditCard}
                        label={c('Label').t`Card number`}
                        upsellRef={UpsellRef.LIMIT_CC}
                    />
                ) : (
                    <ObfuscatedValueControl
                        clickToCopy
                        hidden
                        hiddenValue={cardNumberHiddenValue}
                        icon={IcCreditCard}
                        label={c('Label').t`Card number`}
                        mask={cardNumberMask}
                        value={number}
                        deobfuscate={deobfuscateCCField}
                    />
                )}

                <MaskedValueControl
                    clickToCopy
                    icon={IcCalendarToday}
                    label={c('Label').t`Expiration date`}
                    mask={expDateMask}
                    value={formatExpirationDateMMYY(expirationDate)}
                />

                <ObfuscatedValueControl
                    clickToCopy
                    hidden
                    hiddenValue="••••"
                    icon={IcShield}
                    label={c('Label').t`Security code`}
                    value={verificationNumber}
                    deobfuscate={deobfuscateCCField}
                />

                <ObfuscatedValueControl
                    hidden
                    hiddenValue="••••"
                    icon={IcGrid3}
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
                        icon={IcNote}
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
