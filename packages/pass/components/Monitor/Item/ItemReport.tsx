import { type FC } from 'react';
import { useSelector } from 'react-redux';
import { Route, Switch } from 'react-router-dom';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Dropdown, DropdownMenu, usePopperAnchor } from '@proton/components';
import { ItemTag } from '@proton/pass/components/Item/List/ItemTag';
import { Card } from '@proton/pass/components/Layout/Card/Card';
import { CardContent } from '@proton/pass/components/Layout/Card/CardContent';
import { CardIcon } from '@proton/pass/components/Layout/Card/CardIcon';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { useMonitor } from '@proton/pass/components/Monitor/MonitorContext';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import { itemEq } from '@proton/pass/lib/items/item.predicates';
import { getItemKey } from '@proton/pass/lib/items/item.utils';
import { selectSelectedItems } from '@proton/pass/store/selectors';
import type { ItemRevision, SelectedItem } from '@proton/pass/types';
import { not } from '@proton/pass/utils/fp/predicates';

const BTN_STYLES = {
    '--button-default-background-color': 'var(--interaction-weak-major-1)',
    '--button-hover-background-color': 'var(--interaction-weak-major-2)',
    '--button-active-background-color': 'var(--interaction-weak-major-2)',
    '--button-default-text-color': 'var(--interaction-weak-contrast)',
    '--button-hover-text-color': 'var(--interaction-weak-contrast)',
    '--button-active-text-color': 'var(--interaction-weak-contrast)',
};

const DuplicatePasswordReport: FC<SelectedItem> = (item) => {
    const { duplicates } = useMonitor();
    const { selectItem } = useNavigation();

    const group = duplicates.data.find((group) => group.some(itemEq(item))) ?? [];
    const others = useSelector(selectSelectedItems(group?.filter(not(itemEq(item))) ?? []));
    const total = others.length;

    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const handleClick = (item: ItemRevision) => () =>
        selectItem(item.shareId, item.itemId, { prefix: 'monitor/duplicates' });

    return total > 0 ? (
        <Card className="mb-2" type="warning">
            <CardContent
                icon={() => <CardIcon icon="exclamation-filled" className="self-start mt-0.5" />}
                titleClassname="color-interaction-norm-major-2 text-lg text-semibold"
                subtitleClassname="color-interaction-norm-major-2"
                title={c('Description').ngettext(
                    msgid`${total} other login uses the same password`,
                    `${total} other logins use the same password`,
                    total
                )}
                subtitle={
                    total <= 5 ? (
                        <div className="flex gap-2 mt-2 flex-nowrap overflow-overlay">
                            {others.map((item) => (
                                <Button
                                    key={getItemKey(item)}
                                    className="flex shrink-0 border-none"
                                    style={BTN_STYLES}
                                    size="small"
                                    onClick={handleClick(item)}
                                >
                                    <ItemTag {...item} />
                                </Button>
                            ))}
                        </div>
                    ) : (
                        <Button
                            shape="solid"
                            color="norm"
                            className="button-xs mt-1"
                            size="small"
                            pill
                            style={BTN_STYLES}
                            onClick={toggle}
                            ref={anchorRef}
                        >
                            {c('Action').t`See all`}
                            <Dropdown
                                isOpen={isOpen}
                                anchorRef={anchorRef}
                                onClose={close}
                                originalPlacement="bottom-start"
                            >
                                <DropdownMenu>
                                    {others.map((item) => (
                                        <DropdownMenuButton
                                            key={getItemKey(item)}
                                            label={<ItemTag {...item} />}
                                            onClick={handleClick(item)}
                                        />
                                    ))}
                                </DropdownMenu>
                            </Dropdown>
                        </Button>
                    )
                }
            />
        </Card>
    ) : null;
};

const WeakPasswordReport: FC<SelectedItem> = (item) => {
    const { insecure } = useMonitor();
    const isWeak = insecure.data.some(itemEq(item));

    return (
        isWeak && (
            <Card className="mb-2" type="warning">
                <CardContent
                    icon={() => <CardIcon icon="exclamation-filled" className="self-start mt-0.5" />}
                    titleClassname="color-interaction-norm-major-2 text-lg text-semibold"
                    subtitleClassname="color-interaction-norm-major-2"
                    title={c('Title').t`Weak password`}
                    subtitle={c('Description')
                        .t`This account is vulnerable, visit the service and change your password.`}
                />
            </Card>
        )
    );
};

const Missing2FAReport: FC<SelectedItem> = (item) => {
    const { missing2FAs } = useMonitor();
    const isMissing2FA = missing2FAs.data.some(itemEq(item));

    return (
        isMissing2FA && (
            <Card className="mb-2" type="primary">
                <CardContent
                    icon={() => <CardIcon icon="exclamation-filled" className="self-start mt-0.5" />}
                    titleClassname="text-lg text-semibold"
                    title={c('Title').t`Set up 2FA for more security`}
                    subtitle={c('Description').t`This service offers 2FA. Enable it for added account security.`}
                />
            </Card>
        )
    );
};

export const ItemReport: FC<SelectedItem> = (item) => (
    <Switch>
        <Route path={getLocalPath('monitor/duplicates')} render={() => <DuplicatePasswordReport {...item} />} />
        <Route path={getLocalPath('monitor/weak')} render={() => <WeakPasswordReport {...item} />} />
        <Route path={getLocalPath('monitor/2fa')} render={() => <Missing2FAReport {...item} />} />
    </Switch>
);
