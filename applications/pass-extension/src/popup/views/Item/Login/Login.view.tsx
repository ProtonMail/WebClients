import { type VFC } from 'react';
import { useSelector } from 'react-redux';

import { c, msgid } from 'ttag';

import { Href } from '@proton/atoms';
import { selectAliasByAliasEmail } from '@proton/pass/store';
import { isEmptyString } from '@proton/pass/utils/string';
import { getFormattedDateFromTimestamp } from '@proton/pass/utils/time/format';

import type { ItemTypeViewProps } from '../../../../shared/items/types';
import { MoreInfoDropdown } from '../../../components/Dropdown/MoreInfoDropdown';
import { ClickToCopyValueControl } from '../../../components/Field/Control/ClickToCopyValueControl';
import { ExtraFieldsControl } from '../../../components/Field/Control/ExtraFieldsControl';
import { OTPValueControl } from '../../../components/Field/Control/OTPValueControl';
import { PasswordValueControl } from '../../../components/Field/Control/PasswordValueControl';
import { ValueControl } from '../../../components/Field/Control/ValueControl';
import { FieldsetCluster } from '../../../components/Field/Layout/FieldsetCluster';
import { ItemViewPanel } from '../../../components/Panel/ItemViewPanel';

export const LoginView: VFC<ItemTypeViewProps<'login'>> = ({ vault, revision, ...itemViewProps }) => {
    const { data: item, createTime, lastUseTime, modifyTime, revision: revisionNumber, shareId, itemId } = revision;
    const { metadata, content, extraFields } = item;
    const { name, note } = metadata;
    const { username, password, totpUri, urls } = content;
    const relatedAlias = useSelector(selectAliasByAliasEmail(username));

    return (
        <ItemViewPanel type="login" name={name} vault={vault} {...itemViewProps}>
            <FieldsetCluster mode="read" as="div">
                <ClickToCopyValueControl value={username}>
                    <ValueControl
                        interactive
                        icon={relatedAlias ? 'alias' : 'user'}
                        label={relatedAlias ? c('Label').t`Username (alias)` : c('Label').t`Username`}
                    >
                        {!isEmptyString(username) ? (
                            username
                        ) : (
                            <span className="color-weak text-italic">{c('Info').t`None`}</span>
                        )}
                    </ValueControl>
                </ClickToCopyValueControl>

                <PasswordValueControl password={password} />

                {totpUri && <OTPValueControl shareId={shareId} itemId={itemId} totpUri={totpUri} type="item" />}
            </FieldsetCluster>

            {urls.length > 0 && (
                <FieldsetCluster mode="read" as="div">
                    <ValueControl interactive icon="earth" label={c('Label').t`Websites`}>
                        {urls.map((url) => (
                            <Href className="block mb-1 text-ellipsis" href={url} key={url}>
                                {url}
                            </Href>
                        ))}
                    </ValueControl>
                </FieldsetCluster>
            )}

            {note && (
                <FieldsetCluster mode="read" as="div">
                    <ClickToCopyValueControl value={note}>
                        <ValueControl interactive as="pre" icon="note" label={c('Label').t`Note`}>
                            <pre className="text-break">{note}</pre>
                        </ValueControl>
                    </ClickToCopyValueControl>
                </FieldsetCluster>
            )}

            {Boolean(extraFields.length) && (
                <ExtraFieldsControl extraFields={extraFields} itemId={itemId} shareId={shareId} />
            )}

            <MoreInfoDropdown
                info={[
                    {
                        label: c('Label').t`Last autofill`,
                        values: [lastUseTime ? getFormattedDateFromTimestamp(lastUseTime) : c('Info').t`N/A`],
                    },
                    {
                        label: c('Label').t`Modified`,
                        values: [
                            c('Info').ngettext(
                                msgid`${revisionNumber} time`,
                                `${revisionNumber} times`,
                                revisionNumber
                            ),
                            getFormattedDateFromTimestamp(modifyTime),
                        ],
                    },
                    { label: c('Label').t`Created`, values: [getFormattedDateFromTimestamp(createTime)] },
                ]}
            />
        </ItemViewPanel>
    );
};
