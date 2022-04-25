import React from 'react';
import { PLANS, PLAN_NAMES } from '@proton/shared/lib/constants';
import { Audience } from '@proton/shared/lib/interfaces';

import { SelectTwo, Option } from '../../../components';

interface Props {
    planName?: PLANS;
    target: Audience;
    onChange: (planName: PLANS) => void;
}

const SelectPlan = ({ planName = PLANS.MAIL, target, onChange }: Props) => {
    const handleChange = ({ value }: { value: PLANS }) => onChange(value);

    if (target === Audience.B2C) {
        return (
            <SelectTwo value={planName} onChange={handleChange}>
                <Option value={PLANS.MAIL} title={PLAN_NAMES[PLANS.MAIL]}>
                    {PLAN_NAMES[PLANS.MAIL]}
                </Option>
                {/* <Option value={PLANS.DRIVE} title={PLAN_NAMES[PLANS.DRIVE]}>
                    {PLAN_NAMES[PLANS.DRIVE]}
                </Option> */}
                <Option value={PLANS.VPN} title={PLAN_NAMES[PLANS.VPN]}>
                    {PLAN_NAMES[PLANS.VPN]}
                </Option>
            </SelectTwo>
        );
    }

    return (
        <SelectTwo value={planName} onChange={handleChange}>
            <Option value={PLANS.MAIL_PRO} title={PLAN_NAMES[PLANS.MAIL_PRO]}>
                {PLAN_NAMES[PLANS.MAIL_PRO]}
            </Option>
            <Option value={PLANS.DRIVE_PRO} title={PLAN_NAMES[PLANS.DRIVE_PRO]}>
                {PLAN_NAMES[PLANS.DRIVE_PRO]}
            </Option>
        </SelectTwo>
    );
};

export default SelectPlan;
