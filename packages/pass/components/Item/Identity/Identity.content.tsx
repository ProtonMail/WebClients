import { type FC } from 'react';

import { MaskedValueControl } from '@proton/pass/components/Form/Field/Control/MaskedValueControl';
import { ValueControl } from '@proton/pass/components/Form/Field/Control/ValueControl';
import { FieldBox } from '@proton/pass/components/Form/Field/Layout/FieldBox';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import type { ItemContentProps } from '@proton/pass/components/Views/types';
import { useIdentityContent } from '@proton/pass/hooks/identity/useIdentityContent';

export const IdentityContent: FC<ItemContentProps<'identity'>> = ({ revision }) => {
    const sections = useIdentityContent(revision.data.content);

    return sections.map(({ name, fields }, sectionIndex) => (
        <section key={`${name}::${sectionIndex}`}>
            <FieldBox className="color-weak my-4" unstyled>
                {name}
            </FieldBox>
            <FieldsetCluster mode="read" as="div">
                {fields.map((field, fieldIndex) => {
                    const Component = field.mask ? MaskedValueControl : ValueControl;
                    return (
                        <Component
                            key={`${name}::${sectionIndex}::${fieldIndex}`}
                            clickToCopy
                            label={field.label}
                            value={field.value}
                            mask={field.mask}
                            hidden={field.hidden}
                        />
                    );
                })}
            </FieldsetCluster>
        </section>
    ));
};
