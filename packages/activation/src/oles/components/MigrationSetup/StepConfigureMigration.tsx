import type { FC } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import {
    BorderedContainer,
    BorderedContainerItem,
} from '@proton/components/components/BorderedStackedGroup/BorderedContainer';
import Checkbox from '@proton/components/components/input/Checkbox';
import Label from '@proton/components/components/label/Label';
import { IcCalendarGrid } from '@proton/icons/icons/IcCalendarGrid';
import { IcEnvelopes } from '@proton/icons/icons/IcEnvelopes';
import { IcPerson2 } from '@proton/icons/icons/IcPerson2';

import type { MigrationSetupModel, Product } from '../../types';
import type { StepComponentProps } from './MigrationSetup';

const availableProducts: { id: Product; label: string; icon: React.ReactNode }[] = [
    {
        id: 'Mail',
        label: c('BOSS').t`Mail`,
        icon: <IcEnvelopes className="shrink-0" />,
    },
    {
        id: 'Contacts',
        label: c('BOSS').t`Contacts`,
        icon: <IcPerson2 className="shrink-0" />,
    },
    {
        id: 'Calendar',
        label: c('BOSS').t`Calendar`,
        icon: <IcCalendarGrid className="shrink-0" />,
    },
];

const StepConfigureMigration: FC<{ model: MigrationSetupModel } & StepComponentProps> = ({ model, submitButton }) => {
    const handleServiceSelected = (serviceId: Product) => () => {
        const nextValue = model.selectedProducts.includes(serviceId)
            ? model.selectedProducts.filter((id) => id !== serviceId)
            : [...model.selectedProducts, serviceId];
        model.setSelectedProducts(nextValue);
    };

    return (
        <div className="max-w-custom" style={{ '--max-w-custom': '42rem' }}>
            <h3 className="text-4xl text-bold mb-2">{c('BOSS').t`Configure migration`}</h3>
            <p className="color-weak mt-0">
                {c('BOSS')
                    .t`Choose what to migrate. Your choice will apply to all users. The migration will start after you decide which users to copy.`}
            </p>
            <h4 className="mt-6 mb-3 text-lg text-semibold">{c('BOSS').t`What are you migrating?`}</h4>
            <BorderedContainer className="mb-3">
                {availableProducts.map((s) => (
                    <BorderedContainerItem key={s.id} className="py-1 color-weak flex flex-nowrap gap-4 items-start">
                        <Checkbox
                            className="shrink-0"
                            onChange={handleServiceSelected(s.id)}
                            checked={model.selectedProducts.includes(s.id)}
                            id={`migrate-${s.id}`}
                        />
                        <Label htmlFor={`migrate-${s.id}`} className="flex-1 flex flex-nowrap items-center gap-2 pt-0">
                            {s.icon} {s.label}
                        </Label>
                    </BorderedContainerItem>
                ))}
            </BorderedContainer>
            <p className="color-weak inline-flex items-center gap-1 mt-0">
                {c('BOSS').t`Find out what can be migrated.`}
                <Href href="#" className="inline-block">{c('Link').t`Learn more`}</Href>
            </p>
            {submitButton && <div className="mt-8 flex justify-end">{submitButton}</div>}
        </div>
    );
};

export default StepConfigureMigration;
