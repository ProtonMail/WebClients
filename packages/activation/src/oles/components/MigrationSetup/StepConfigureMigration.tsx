import { type FC, useEffect } from 'react';

import { c, msgid } from 'ttag';

import { Checkbox, InputFieldTwo, Label, Option, SelectTwo } from '@proton/components';

import type { MigrationSetupModel, Product, TimePeriod } from '../../types';

const availableProducts: { id: Product; label: string }[] = [
    {
        id: 'Mail',
        label: c('BOSS').t`Mail`,
    },
    {
        id: 'Contacts',
        label: c('BOSS').t`Contacts`,
    },
    {
        id: 'Calendar',
        label: c('BOSS').t`Calendar`,
    },
];

const getTimePeriodLabel = (n: number) => c('BOSS').ngettext(msgid`${n} year ago`, `${n} years ago`, n);

const timePeriods: { id: TimePeriod; label: string }[] = [
    {
        id: 'all',
        label: c('BOSS').t`Everything`,
    },
    {
        id: '1yr',
        label: getTimePeriodLabel(1),
    },
    {
        id: '2yr',
        label: getTimePeriodLabel(2),
    },
    {
        id: '5yr',
        label: getTimePeriodLabel(5),
    },
];

const StepConfigureMigration: FC<{ model: MigrationSetupModel }> = ({ model }) => {
    useEffect(() => {
        model.setSelectedProducts(['Mail', 'Calendar', 'Contacts']);
    }, []);

    const handleServiceSelected = (serviceId: Product) => () => {
        const nextValue = model.selectedProducts.includes(serviceId)
            ? model.selectedProducts.filter((id) => id !== serviceId)
            : [...model.selectedProducts, serviceId];
        model.setSelectedProducts(nextValue);
    };

    return (
        <div className="max-w-custom" style={{ '--max-w-custom': '38rem' }}>
            <p className="text-xl text-bold mb-2">{c('BOSS').t`Configure migration`}</p>
            <p className="color-weak mt-0">
                {c('BOSS')
                    .t`Select what you want to migrate, this will apply to all users whether they are created now or later. Migration will start after user accounts are created.`}
            </p>

            <section>
                <header className="mt-8 mb-2">
                    <div className="text-bold mb-1">{c('BOSS').t`What are you migrating?`}</div>
                    <div className="color-weak">{c('BOSS').t`Learn more about what can be migrated. Learn more`}</div>
                </header>
                {availableProducts.map((s) => (
                    <div key={s.id} className="py-1 color-weak">
                        <Checkbox
                            className="mr-2"
                            onChange={handleServiceSelected(s.id)}
                            checked={model.selectedProducts.includes(s.id)}
                            id={`migrate-${s.id}`}
                        />
                        <Label htmlFor={`migrate-${s.id}`}>{s.label}</Label>
                    </div>
                ))}
            </section>

            <section>
                <header className="mt-8 mb-2">
                    <div className="text-bold mb-1">{c('BOSS').t`Transfer data from`}</div>
                </header>
                <SelectTwo value={model.timePeriod} onChange={({ value }) => model.setTimePeriod(value)}>
                    {timePeriods.map((tp) => (
                        <Option key={tp.id} value={tp.id} title={tp.label} />
                    ))}
                </SelectTwo>
            </section>

            <section>
                <header className="mt-8 mb-2">
                    <div className="text-bold mb-1">{c('BOSS').t`Who will be notified?`}</div>
                    <div className="color-weak">{c('BOSS')
                        .t`Email notifications will be sent when migration starts and when it’s completed. You will also be notified if there are errors and if migration is paused due to expired links.`}</div>
                </header>
                <InputFieldTwo
                    value={model.notifyList.join('')}
                    onChange={(e) => model.setNotifyList([e.target.value])}
                    placeholder={c('BOSS').t`Add more users...`}
                />
            </section>
        </div>
    );
};

export default StepConfigureMigration;
