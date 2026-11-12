import { Fragment } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { DashboardCard, DashboardCardContent, DashboardCardDivider } from '@proton/atoms/DashboardCard/DashboardCard';
import { DashboardGrid } from '@proton/atoms/DashboardGrid/DashboardGrid';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';

import Radio from '../../../components/input/Radio';
import { useRevisionRetentionDays } from '../../../hooks/drive/useRevisionRetentionDays';
import { useDeleteVersionHistoryPrompt } from './DeleteVersionHistoryPrompt';
import { BusinessUpgradeBanner } from './banner/BusinessUpgradeBanner';
import { FreeUpgradeBanner } from './banner/FreeUpgradeBanner';
import { useRetentionOptions } from './useRetentionOptions';

export const RetentionDaysSection = () => {
    const [{ hasPaidDrive, isAdmin }] = useUser();

    const [deleteVersionHistoryPrompt, showDeleteVersionHistoryPrompt] = useDeleteVersionHistoryPrompt();
    const { revisionRetentionDays, hasValueChanged, isLoading, isSubmitLoading, handleSubmit, handleChange } =
        useRevisionRetentionDays(hasPaidDrive, showDeleteVersionHistoryPrompt);

    const { options, canUpsellFree, canContactSalesForLongerHistory } = useRetentionOptions(revisionRetentionDays);

    return (
        <form onSubmit={handleSubmit}>
            <DashboardGrid>
                {canUpsellFree && <FreeUpgradeBanner />}
                {canContactSalesForLongerHistory && isAdmin && <BusinessUpgradeBanner />}
                <DashboardCard>
                    <DashboardCardContent>
                        <span className="sr-only" id="id_desc_history">
                            {c('Info').t`Version history`}
                        </span>
                        {options.map((option, index) => {
                            const id = option.value.toString();

                            let optionRadio = (
                                <Radio
                                    aria-describedby="id_desc_history"
                                    onChange={() => handleChange(option.value)}
                                    id={`retention${id}`}
                                    name="retention"
                                    disabled={isLoading || isSubmitLoading || option.disabled}
                                    checked={!isLoading && revisionRetentionDays === option.value}
                                    className="w-full flex flex-nowrap items-center text-semibold"
                                >
                                    {option.label}
                                </Radio>
                            );

                            if (option.isUpsell) {
                                optionRadio = (
                                    <Tooltip title={c('Info').t`Upgrade to unlock`} originalPlacement="right">
                                        <div className="w-full">{optionRadio}</div>
                                    </Tooltip>
                                );
                            }

                            return (
                                <Fragment key={id}>
                                    {index > 0 && <DashboardCardDivider />}
                                    {optionRadio}
                                </Fragment>
                            );
                        })}
                        <DashboardCardDivider />
                        <div className="flex justify-end">
                            <Button type="submit" color="norm" loading={isSubmitLoading} disabled={!hasValueChanged}>{c(
                                'Action'
                            ).t`Save changes`}</Button>
                        </div>
                    </DashboardCardContent>
                </DashboardCard>
            </DashboardGrid>
            {deleteVersionHistoryPrompt}
        </form>
    );
};
