import type { FC } from 'react';

import { c } from 'ttag';

import { Checkbox, Label } from '@proton/components';

import type { MigrationSetupModel, Product } from '../../types';

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

const StepConfigureMigration: FC<{ model: MigrationSetupModel }> = ({ model }) => {
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
                <div className="py-1 color-weak">
                    <Checkbox
                        className="mr-2"
                        onChange={() => model.setImportOrganizationSettings(!model.importOrganizationSettings)}
                        checked={model.importOrganizationSettings}
                        id={`migrate-settings`}
                    />
                    <Label htmlFor={`migrate-settings`}>{c('BOSS').t`Organization settings`}</Label>
                </div>
            </section>
        </div>
    );
};

export default StepConfigureMigration;
