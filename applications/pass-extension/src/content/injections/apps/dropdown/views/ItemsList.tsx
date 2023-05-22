import type { VFC } from 'react';
import { useMemo } from 'react';

import { c } from 'ttag';

import type { SafeLoginItem } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import { navigateToUpgrade } from '../../../../../shared/components/upgrade/UpgradeButton';
import { DropdownItem } from '../components/DropdownItem';
import { DropdownItemsList } from '../components/DropdownItemsList';

type Props = {
    items: SafeLoginItem[];
    needsUpgrade: boolean;
    onSubmit: (item: SafeLoginItem) => void;
};

export const ItemsList: VFC<Props> = ({ items, needsUpgrade, onSubmit }) => {
    const dropdownItems = useMemo(
        () =>
            [
                needsUpgrade && (
                    <DropdownItem
                        key={'upgrade-autofill'}
                        icon="arrow-out-square"
                        title={c('Info').t`Upgrade ${PASS_APP_NAME}`}
                        subTitle={c('Warning').t`Your plan only allows you to autofill from your primary vault`}
                        onClick={navigateToUpgrade}
                        autogrow
                    />
                ),
                ...items.map((item) => (
                    <DropdownItem
                        key={item.itemId}
                        icon="key"
                        title={item.name}
                        subTitle={item.username}
                        onClick={() => onSubmit(item)}
                    />
                )),
            ].filter(truthy),
        [items, needsUpgrade, onSubmit]
    );

    return <DropdownItemsList>{dropdownItems}</DropdownItemsList>;
};
