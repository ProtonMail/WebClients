import type { SetStateAction } from 'react';

import { type FormikErrors } from 'formik';
import { c, msgid } from 'ttag';

import RadioGroup from '@proton/components/components/input/RadioGroup';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import { RetentionRuleAction, RetentionRuleProduct } from '@proton/shared/lib/interfaces/RetentionRule';

import type { RetentionRuleFormData } from './types';

import './RetentionDurationSetting.scss';

enum RetentionLifeTimeType {
    Infinite = 0,
    Duration = 1,
}

interface Props {
    values: RetentionRuleFormData;
    setValues: (
        values: SetStateAction<RetentionRuleFormData>,
        shouldValidate?: boolean
    ) => Promise<void> | Promise<FormikErrors<RetentionRuleFormData>>;
}

const getInfiniteRetentionLabel = (selectedProduct: RetentionRuleProduct) => {
    if (selectedProduct === RetentionRuleProduct.Mail) {
        return c('retention_policy_2025_Label').t`Keep messages forever`;
    }
    return c('retention_policy_2025_Label').t`Keep items forever`;
};

const getExpireActionTitle = (expireAction: RetentionRuleAction, selectedProduct: RetentionRuleProduct) => {
    if (selectedProduct === RetentionRuleProduct.Mail) {
        if (expireAction === RetentionRuleAction.RetainPurgeAll) {
            return c('retention_policy_2025_Option').t`Purge all messages`;
        }
        if (expireAction === RetentionRuleAction.RetainPurgeDeleted) {
            return c('retention_policy_2025_Option').t`Purge deleted messages only`;
        }
    }

    return 'Unknown action';
};

const getExpireActionDescription = (expireAction: RetentionRuleAction, selectedProduct: RetentionRuleProduct) => {
    if (selectedProduct === RetentionRuleProduct.Mail) {
        if (expireAction === RetentionRuleAction.RetainPurgeAll) {
            return c('retention_policy_2025_Info')
                .t`Includes all messages in Inbox, Sent, and all other locations. Purged messages cannot be recovered.`;
        }
        if (expireAction === RetentionRuleAction.RetainPurgeDeleted) {
            return c('retention_policy_2025_Info').t`Removes messages already deleted by users.`;
        }
    }

    return 'Unknown action description';
};

const getLifetimeType = (lifetime: number | null) => {
    if (lifetime === null) {
        return RetentionLifeTimeType.Infinite;
    }
    return RetentionLifeTimeType.Duration;
};

const RetentionDurationSetting = ({ values, setValues }: Props) => {
    const { lifetime, action: expireAction, products: selectedProduct } = values;

    const handleSetLifetimeType = (value: RetentionLifeTimeType) => {
        if (value === RetentionLifeTimeType.Infinite) {
            void setValues({ ...values, action: RetentionRuleAction.RetainAll, lifetime: null }, true);
        } else {
            void setValues({ ...values, action: RetentionRuleAction.RetainPurgeDeleted, lifetime: 365 }, true);
        }
    };

    return (
        <div className="mt-4 flex flex-column gap-2">
            <label className="text-semibold block mb-1">{c('retention_policy_2025_Label').t`Retention period`}</label>
            <RadioGroup
                name="retention-period"
                value={getLifetimeType(lifetime)}
                onChange={handleSetLifetimeType}
                options={[
                    { value: RetentionLifeTimeType.Infinite, label: getInfiniteRetentionLabel(selectedProduct) },
                    {
                        value: RetentionLifeTimeType.Duration,
                        label: c('retention_policy_2025_Label').t`Set a duration`,
                    },
                ]}
            />
            {values.lifetime !== null && (
                <div className="pl-8">
                    <div style={{ width: '128px' }}>
                        <InputFieldTwo
                            id="policy-duration"
                            type="number"
                            min={30}
                            max={36500}
                            value={lifetime ?? ''}
                            onValue={(value: string) => setValues({ ...values, lifetime: Number(value) })}
                            placeholder={c('retention_policy_2025_Placeholder').t`Enter duration`}
                            suffix={
                                <span className="px-2">
                                    {c('retention_policy_2025_Label').ngettext(msgid`day`, `days`, lifetime ?? 1)}
                                </span>
                            }
                            dense
                        />
                    </div>
                    <label htmlFor="expire-action" className="text-semibold text-rg block mb-4 mt-4">
                        {c('retention_policy_2025_Label').t`After retention period expires`}
                    </label>
                    <div className="flex flex-column">
                        <RadioGroup
                            name="expire-action"
                            value={expireAction}
                            onChange={(value) => setValues({ ...values, action: value }, true)}
                            className="retention-duration-radio-group"
                            options={[
                                {
                                    value: RetentionRuleAction.RetainPurgeDeleted,
                                    label: (
                                        <div className="flex flex-column flex-1">
                                            <div className="mb-1">
                                                {getExpireActionTitle(
                                                    RetentionRuleAction.RetainPurgeDeleted,
                                                    selectedProduct
                                                )}
                                            </div>
                                            <div className="text-sm color-weak">
                                                {getExpireActionDescription(
                                                    RetentionRuleAction.RetainPurgeDeleted,
                                                    selectedProduct
                                                )}
                                            </div>
                                        </div>
                                    ),
                                },
                                {
                                    value: RetentionRuleAction.RetainPurgeAll,
                                    label: (
                                        <div className="flex flex-column flex-1">
                                            <div className="mb-1">
                                                {getExpireActionTitle(
                                                    RetentionRuleAction.RetainPurgeAll,
                                                    selectedProduct
                                                )}
                                            </div>
                                            <div className="text-sm color-weak">
                                                {getExpireActionDescription(
                                                    RetentionRuleAction.RetainPurgeAll,
                                                    selectedProduct
                                                )}
                                            </div>
                                        </div>
                                    ),
                                },
                            ]}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default RetentionDurationSetting;
