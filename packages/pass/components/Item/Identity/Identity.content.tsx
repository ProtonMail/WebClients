import type { FC } from 'react';

import { useIdentityContent } from '../../../hooks/identity/useIdentityContent';
import { ExtraFieldsControl } from '../../Form/Field/Control/ExtraFieldsControl';
import { ValueControl } from '../../Form/Field/Control/ValueControl';
import { FieldBox } from '../../Form/Field/Layout/FieldBox';
import { FieldsetCluster } from '../../Form/Field/Layout/FieldsetCluster';
import type { ItemContentProps } from '../../Views/types';

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
