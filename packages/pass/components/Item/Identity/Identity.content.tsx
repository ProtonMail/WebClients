import { type FC } from 'react';

import { ExtraFieldsControl } from '@proton/pass/components/Form/Field/Control/ExtraFieldsControl';
import { ValueControl } from '@proton/pass/components/Form/Field/Control/ValueControl';
import { FieldBox } from '@proton/pass/components/Form/Field/Layout/FieldBox';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import type { ItemContentProps } from '@proton/pass/components/Views/types';
import { useIdentityContent } from '@proton/pass/hooks/identity/useIdentityContent';

export const IdentityContent: FC<ItemContentProps<'identity'>> = ({ revision }) => {
    const { shareId, itemId } = revision;
    const sections = useIdentityContent(revision.data.content);

    return sections.map(({ name, fields, customFields }, sectionIndex) => (
        <section key={`${name}::${sectionIndex}`}>
            <FieldBox className="color-weak my-4" unstyled>
                {name}
            </FieldBox>
            <FieldsetCluster mode="read" as="div">
                <ExtraFieldsControl extraFields={customFields} itemId={itemId} shareId={shareId} hideIcons>
                    {fields.map((field, fieldIndex) => (
                        <ValueControl
                            key={`${name}::${sectionIndex}::${fieldIndex}`}
                            clickToCopy
                            label={field.label}
                            value={field.value}
                            hidden={field.hidden}
                        />
                    ))}
                </ExtraFieldsControl>
            </FieldsetCluster>
        </section>
    ));
};
