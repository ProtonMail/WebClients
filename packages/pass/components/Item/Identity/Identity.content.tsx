import { type FC, useMemo } from 'react';

import { ValueControl } from '@proton/pass/components/Form/Field/Control/ValueControl';
import { FieldBox } from '@proton/pass/components/Form/Field/Layout/FieldBox';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import type { ItemContentProps } from '@proton/pass/components/Views/types';
import { useIdentityFormSections } from '@proton/pass/hooks/identity/useIdentityFormSections';

export const IdentityContent: FC<ItemContentProps<'identity'>> = ({
    revision: {
        data: { content },
    },
}) => {
    const { sections, getFilteredSections } = useIdentityFormSections();
    const fieldSections = useMemo(() => getFilteredSections(content), [content, sections]);

    return fieldSections.map(({ name, fields }) => (
        <section key={name}>
            <FieldBox className="color-weak my-4" unstyled>
                {name}
            </FieldBox>
            <FieldsetCluster mode="read" as="div">
                {fields.map((field) => (
                    <ValueControl key={field.name} clickToCopy label={field.label} value={field.value} />
                ))}
            </FieldsetCluster>
        </section>
    ));
};
