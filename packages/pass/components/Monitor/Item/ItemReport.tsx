import { type FC } from 'react';
import { useSelector } from 'react-redux';
import { Route, Switch } from 'react-router-dom';

import { c, msgid } from 'ttag';

import { PinnedItem } from '@proton/pass/components/Item/Pinned/PinnedItem';
import { Card } from '@proton/pass/components/Layout/Card/Card';
import { CardContent } from '@proton/pass/components/Layout/Card/CardContent';
import { CardIcon } from '@proton/pass/components/Layout/Card/CardIcon';
import { useMonitor } from '@proton/pass/components/Monitor/MonitorProvider';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import { itemEq } from '@proton/pass/lib/items/item.predicates';
import { getItemKey } from '@proton/pass/lib/items/item.utils';
import { selectSelectedItems } from '@proton/pass/store/selectors';
import type { SelectedItem } from '@proton/pass/types';
import { invert } from '@proton/pass/utils/fp/predicates';

const DuplicatePasswordReport: FC<SelectedItem> = (item) => {
    const { duplicates } = useMonitor();
    const { selectItem } = useNavigation();

    const group = duplicates.data.find((group) => group.some(itemEq(item))) ?? [];
    const others = useSelector(selectSelectedItems(group?.filter(invert(itemEq(item))) ?? []));
    const total = others.length;

    return total > 0 ? (
        <Card className="mb-2" type="warning">
            <CardContent
                icon={() => <CardIcon icon="exclamation-filled" className="self-start mt-1" />}
                titleClassname="color-interaction-norm-major-2 text-lg text-semibold"
                subtitleClassname="color-interaction-norm-major-2"
                title={c('Title').t`Reused passwords`}
                subtitle={
                    <>
                        <div>
                            {total <= 5 ? (
                                <>
                                    {c('Description').ngettext(
                                        msgid`${total} other login uses this password:`,
                                        `${total} other logins use this password:`,
                                        total
                                    )}
                                    <div className="flex gap-2 my-2 flex-nowrap overflow-overlay">
                                        {others.map((item) => (
                                            <PinnedItem
                                                onClick={() =>
                                                    selectItem(item.shareId, item.itemId, {
                                                        prefix: 'monitor/duplicates',
                                                    })
                                                }
                                                item={item}
                                                key={getItemKey(item)}
                                                active
                                            />
                                        ))}
                                    </div>
                                </>
                            ) : (
                                // translator full sentence is "X other login use this password", in this usecase X is allwas >5 and the text "X other login" is displayed as pill
                                c('Description').jt`${total} other logins use this password`
                            )}
                        </div>
                        <div>{c('Description').t`Visit the website and generate a unique password for this item.`}</div>
                    </>
                }
            />
        </Card>
    ) : null;
};

const WeakPasswordReport: FC = () => (
    <Card className="mb-2" type="warning">
        <CardContent
            icon={() => <CardIcon icon="exclamation-filled" className="self-start mt-1" />}
            titleClassname="color-interaction-norm-major-2 text-lg text-semibold"
            subtitleClassname="color-interaction-norm-major-2"
            title={c('Title').t`Weak password`}
            subtitle={c('Description').t`This account is vulnerable, visit the service and change your password.`}
        />
    </Card>
);

const Missing2FAReport: FC = () => (
    <Card className="mb-2" type="primary">
        <CardContent
            icon={() => <CardIcon icon="exclamation-filled" className="self-start mt-1" />}
            titleClassname="text-lg text-semibold"
            title={c('Title').t`Missing two-factor authentication`}
            subtitle={c('Description').t`It would be more secure to set up 2FA for this account.`}
        />
    </Card>
);

export const ItemReport: FC<SelectedItem> = (item) => (
    <Switch>
        <Route path={getLocalPath('monitor/duplicates')} render={() => <DuplicatePasswordReport {...item} />} />
        <Route path={getLocalPath('monitor/weak')} render={() => <WeakPasswordReport />} />
        <Route path={getLocalPath('monitor/2fa')} render={() => <Missing2FAReport />} />
    </Switch>
);
