import type { FC } from 'react';

import { c } from 'ttag';

import { useDeobfuscatedItem, usePartialDeobfuscatedItem } from '../../../hooks/useDeobfuscatedItem';
import type { ItemCustomType, ItemRevision } from '../../../types';
import { ExtraFieldsControl } from '../../Form/Field/Control/ExtraFieldsControl';
import { ValueControl } from '../../Form/Field/Control/ValueControl';
import { FieldBox } from '../../Form/Field/Layout/FieldBox';
import { FieldsetCluster } from '../../Form/Field/Layout/FieldsetCluster';
import { TextAreaReadonly } from '../../Form/legacy/TextAreaReadonly';
import type { ItemContentProps } from '../../Views/types';
import { wifiSecurityLabel } from './Custom.utils';

const WifiContent: FC<{ revision: ItemRevision<'wifi'> }> = ({ revision }) => {
    const { content } = useDeobfuscatedItem(revision.data);

    return (
        <FieldsetCluster mode="read" as="div">
            <ValueControl label={c('Label').t`Name (SSID)`} value={content.ssid} clickToCopy />
            <ValueControl label={c('Label').t`Password`} value={content.password} clickToCopy hidden />
            <ValueControl label={c('Label').t`Security`} value={wifiSecurityLabel[content.security]()} clickToCopy />
        </FieldsetCluster>
    );
};

const SSHKeyContent: FC<{ revision: ItemRevision<'sshKey'> }> = ({ revision }) => {
    const { content } = useDeobfuscatedItem(revision.data);

    return (
        <FieldsetCluster mode="read" as="div">
            <ValueControl label={c('Label').t`Public key`} value={content.publicKey} clickToCopy ellipsis={false} />
            <ValueControl
                label={c('Label').t`Private key`}
                value={content.privateKey}
                clickToCopy
                ellipsis={false}
                hidden
            />
        </FieldsetCluster>
    );
};

export const CustomContent = <T extends ItemCustomType>({ revision }: ItemContentProps<T>) => {
    const { shareId, itemId, data: item } = revision as ItemRevision<ItemCustomType>;
    const { extraFields, content, metadata } = usePartialDeobfuscatedItem(item);
    const { note } = metadata;

    return (
        <>
            {revision.data.type === 'wifi' && <WifiContent revision={revision as ItemRevision<'wifi'>} />}

            {revision.data.type === 'sshKey' && <SSHKeyContent revision={revision as ItemRevision<'sshKey'>} />}

            {extraFields.length > 0 && (
                <ExtraFieldsControl extraFields={extraFields} itemId={itemId} shareId={shareId} hideIcons />
            )}

            {content.sections.map(({ sectionName: name, sectionFields: fields }, sectionIndex) => (
                <section key={`${name}::${sectionIndex}`}>
                    <FieldBox className="color-weak my-4" unstyled>
                        {name}
                    </FieldBox>
                    <FieldsetCluster mode="read" as="div">
                        <ExtraFieldsControl extraFields={fields} itemId={itemId} shareId={shareId} hideIcons />
                    </FieldsetCluster>
                </section>
            ))}

            {note && (
                <FieldsetCluster mode="read" as="div">
                    <ValueControl
                        clickToCopy
                        as={TextAreaReadonly}
                        icon="note"
                        label={c('Label').t`Note`}
                        value={note}
                    />
                </FieldsetCluster>
            )}
        </>
    );
};
