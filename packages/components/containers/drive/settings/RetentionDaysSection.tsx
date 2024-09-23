import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { useConfirmActionModal, useRevisionRetentionDays, useUser } from '@proton/components';
import Radio from '@proton/components/components/input/Radio';
import Tooltip from '@proton/components/components/tooltip/Tooltip';
import clsx from '@proton/utils/clsx';

import { BusinessUpgradeBanner } from './banner/BusinessUpgradeBanner';
import { FreeUpgradeBanner } from './banner/FreeUpgradeBanner';
import { useRetentionOptions } from './useRetentionOptions';

export const RetentionDaysSection = () => {
    const [{ hasPaidDrive, isAdmin }] = useUser();

    const [confirmActionModal, showConfirmActionModal] = useConfirmActionModal();
    const { revisionRetentionDays, hasValueChanged, isLoading, isSubmitLoading, handleSubmit, handleChange } =
        useRevisionRetentionDays(hasPaidDrive, showConfirmActionModal);

    const { options, canUpsellFree, canUpsellB2B } = useRetentionOptions(revisionRetentionDays);

    return (
        <div className="max-w-custom" style={{ '--max-w-custom': '41em' }}>
            {canUpsellFree && <FreeUpgradeBanner />}
            {canUpsellB2B && isAdmin && <BusinessUpgradeBanner />}
            <form className="flex flex-column items-start gap-2 mt-6" onSubmit={handleSubmit}>
                <span className="sr-only" id="id_desc_history">
                    {c('Info').t`Version history`}
                </span>
                {options.map((option) => {
                    const id = option.value.toString();
                    const radioProps = {
                        onChange: () => handleChange(option.value),
                        id: `retention${id}`,
                        name: 'retention',
                        disabled: isLoading || isSubmitLoading || option.disabled,
                        checked: !isLoading && revisionRetentionDays === option.value,
                        className: clsx(
                            'w-full flex flex-nowrap border rounded p-3',
                            !isLoading && revisionRetentionDays === option.value ? 'border-primary' : 'border-norm'
                        ),
                    };

                    let optionRadio = (
                        <Radio aria-describedby="id_desc_history" {...radioProps}>
                            {option.label}
                        </Radio>
                    );

                    if (option.isUpsell) {
                        optionRadio = (
                            <Tooltip key={id} title={c('Info').t`Upgrade to unlock`} originalPlacement="right">
                                <div className="w-full">{optionRadio}</div>
                            </Tooltip>
                        );
                    }

                    return optionRadio;
                })}
                <Button
                    className="mt-6"
                    type="submit"
                    size="large"
                    color="norm"
                    loading={isSubmitLoading}
                    disabled={!hasValueChanged}
                >{c('Action').t`Save changes`}</Button>
            </form>
            {confirmActionModal}
        </div>
    );
};
