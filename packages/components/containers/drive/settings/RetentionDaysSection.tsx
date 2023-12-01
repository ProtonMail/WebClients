import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import {
    Radio,
    RevisionsUpgradeBanner,
    Tooltip,
    useConfirmActionModal,
    useRevisionRetentionDays,
    useUser,
} from '@proton/components';
import type { RevisionRetentionDaysSetting } from '@proton/shared/lib/interfaces/drive/userSettings';
import clsx from '@proton/utils/clsx';

import { getRetentionLabel } from './retentionLabels';

const RetentionDaysSection = () => {
    const [{ hasPaidDrive }] = useUser();
    const [confirmActionModal, showConfirmActionModal] = useConfirmActionModal();
    const { revisionRetentionDays, hasValueChanged, isLoading, isSubmitLoading, handleSubmit, handleChange } =
        useRevisionRetentionDays(hasPaidDrive, showConfirmActionModal);

    const options: {
        value: RevisionRetentionDaysSetting;
        label: string;
        disabled?: boolean;
    }[] = [
        { value: 0, label: c('Label').t`Don't keep versions` },
        { value: 7, label: getRetentionLabel(7) },
        { value: 30, label: getRetentionLabel(30) },
        { value: 180, label: getRetentionLabel(180) },
        { value: 365, label: getRetentionLabel(365) },
        { value: 3650, label: getRetentionLabel(3650) },
    ];

    return (
        <div className="max-w-custom" style={{ '--max-w-custom': '37em' }}>
            {!hasPaidDrive ? <RevisionsUpgradeBanner /> : null}
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
                        // If free user revisionRetentionDays will be the default and only available value
                        disabled:
                            isLoading || isSubmitLoading || (option.value !== revisionRetentionDays && !hasPaidDrive),
                        checked: !isLoading && revisionRetentionDays === option.value,
                        className: clsx(
                            'w-full flex flex-nowrap border rounded p-3',
                            !isLoading && revisionRetentionDays === option.value ? 'border-primary' : 'border-norm'
                        ),
                    };

                    if (option.value !== revisionRetentionDays && !hasPaidDrive) {
                        return (
                            <Tooltip key={id} title={c('Info').t`Upgrade to unlock`} originalPlacement="right">
                                <div className="w-full">
                                    <Radio aria-describedby="id_desc_history" {...radioProps}>
                                        {option.label}
                                    </Radio>
                                </div>
                            </Tooltip>
                        );
                    }
                    return (
                        <Radio aria-describedby="id_desc_history" key={id} {...radioProps}>
                            {option.label}
                        </Radio>
                    );
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

export default RetentionDaysSection;
