import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
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
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import type { Product } from '../../types';
import type { StepComponentProps } from './MigrationSetup';

const availableProducts: { id: Product; label: string; icon: React.ReactNode }[] = [
    {
        id: 'Mail',
        label: c('BOSS').t`Emails`,
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

const StepConfigureMigration: FC<StepComponentProps> = ({ model, onNext }) => {
    const handleServiceSelected = (serviceId: Product) => () => {
        const nextValue = model.selectedProducts.includes(serviceId)
            ? model.selectedProducts.filter((id) => id !== serviceId)
            : [...model.selectedProducts, serviceId];

        model.update({ selectedProducts: nextValue });
    };

    return (
        <div className="max-w-custom" style={{ '--max-w-custom': '42rem' }}>
            <div className="flex justify-space-between flex-nowrap items-center gap-4 mb-4">
                <h3 className="text-4xl text-bold">{c('BOSS').t`Configure migration`}</h3>
                <div className="flex gap-2 shrink-0 text-semibold">
                    <Button
                        disabled={!onNext}
                        onClick={() => onNext?.()}
                        color="norm"
                        size="medium"
                        className="rounded-lg"
                    >
                        {c('Action').t`Next`}
                    </Button>
                </div>
            </div>
            <p className="color-weak mt-0">
                {c('BOSS').t`Select exactly what you'd like to migrate. It will apply to all organisation users.`}
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
                            disabled={Boolean(model.importerOrganizationId)}
                        />
                        <Label htmlFor={`migrate-${s.id}`} className="flex-1 flex flex-nowrap items-center gap-2 pt-0">
                            {s.icon} {s.label}
                        </Label>
                    </BorderedContainerItem>
                ))}
            </BorderedContainer>
            <p className="color-weak inline-flex items-center gap-1 mt-0">
                {c('BOSS').t`Find out what can be migrated.`}
                <Href href={getKnowledgeBaseUrl('/easy-switch-for-business')} className="inline-block">{c('Link')
                    .t`Learn more`}</Href>
            </p>
        </div>
    );
};

export default StepConfigureMigration;
