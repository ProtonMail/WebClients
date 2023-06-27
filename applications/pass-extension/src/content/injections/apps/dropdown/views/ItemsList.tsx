import type { VFC } from 'react';
import { useMemo } from 'react';

import { c } from 'ttag';

import type { SafeLoginItem } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import { navigateToUpgrade } from '../../../../../shared/components/upgrade/UpgradeButton';
import type { IFrameMessage } from '../../../../types';
import { IFrameMessageType } from '../../../../types';
import { useIFrameContext } from '../../context/IFrameContextProvider';
import { DropdownItem } from '../components/DropdownItem';
import { DropdownItemsList } from '../components/DropdownItemsList';

type Props = {
    items: SafeLoginItem[];
    needsUpgrade: boolean;
    onMessage?: (message: IFrameMessage) => void;
};

export const ItemsList: VFC<Props> = ({ items, needsUpgrade, onMessage }) => {
    const { settings } = useIFrameContext();

    const dropdownItems = useMemo(
        () =>
            [
                needsUpgrade && (
                    <DropdownItem
                        key={'upgrade-autofill'}
                        icon="arrow-out-square"
                        title={c('Info').t`Upgrade ${PASS_APP_NAME}`}
                        subTitle={
                            <span className="text-sm block">{c('Warning')
                                .t`Your plan only allows you to autofill from your primary vault`}</span>
                        }
                        onClick={navigateToUpgrade}
                        autogrow
                    />
                ),
                ...items.map((item) => (
                    <DropdownItem
                        key={item.itemId}
                        title={item.name}
                        subTitle={item.username}
                        url={settings.loadDomainImages ? item.url : undefined}
                        icon="user"
                        onClick={() =>
                            onMessage?.({
                                type: IFrameMessageType.DROPDOWN_AUTOFILL_LOGIN,
                                payload: { item },
                            })
                        }
                    />
                )),
            ].filter(truthy),
        [items, needsUpgrade, onMessage]
    );

    return <DropdownItemsList>{dropdownItems}</DropdownItemsList>;
};
