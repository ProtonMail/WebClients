import type { VFC } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import {
    Dropdown,
    DropdownMenu,
    DropdownMenuButton,
    Header as HeaderComponent,
    Icon,
    usePopperAnchor,
} from '@proton/components';
import { selectAliasLimits } from '@proton/pass/store';
import type { ItemType } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp';
import clsx from '@proton/utils/clsx';

import { itemTypeToIconName } from '../../../shared/items';
import { itemTypeToItemClassName } from '../../../shared/items/className';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { useItemsFilteringContext } from '../../hooks/useItemsFilteringContext';
import { usePopupContext } from '../../hooks/usePopupContext';
import { OnboardingPanel } from '../Onboarding/OnboardingPanel';
import { usePasswordGeneratorContext } from '../PasswordGenerator/PasswordGeneratorContext';
import { MenuDropdown } from './MenuDropdown';
import { Searchbar } from './Searchbar';

const ITEM_TYPE_DROPDOWN_BUTTONS = [
    {
        label: c('Label').t`Login`,
        type: 'login' as const,
    },
    {
        label: c('Label').t`Alias`,
        type: 'alias' as const,
    },
    {
        label: c('Label').t`Note`,
        type: 'note' as const,
    },
];

export const Header: VFC<{}> = () => {
    const history = useHistory();
    const { ready } = usePopupContext();
    const { search, setSearch } = useItemsFilteringContext();
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const { generatePassword } = usePasswordGeneratorContext();
    const withClose = <T extends (...args: any[]) => void>(action: T) => pipe(action, close) as T;
    const copyToClipboard = useCopyToClipboard();
    const { needsUpgrade, aliasLimit, aliasLimited, aliasTotalCount } = useSelector(selectAliasLimits);

    const handleNewItemClick = (type: ItemType) => {
        // Trick to be able to return to the initial route using history.goBack() if user switches
        // from iteam creation routes for multiple subsequent item types.
        const shouldReplace = history.location.pathname.includes('/item/new/');
        history[shouldReplace ? 'replace' : 'push'](`/item/new/${type}`);
    };

    const handleNewPasswordClick = () => {
        void generatePassword({
            actionLabel: c('Action').t`Copy and close`,
            className: 'ui-password',
            onSubmit: (password) => copyToClipboard(password),
        });
    };

    return (
        <>
            <HeaderComponent className="border-bottom hauto p-2">
                <div className="flex flex-align-items-center gap-x-2 w100">
                    <MenuDropdown />
                    <Searchbar disabled={!ready} value={search} handleValue={setSearch} />

                    <Button
                        icon
                        pill
                        color="norm"
                        disabled={!ready}
                        onClick={toggle}
                        ref={anchorRef}
                        size="small"
                        title={c('Action').t`Add new item`}
                    >
                        <Icon name="plus" alt={c('Action').t`Add new item`} />
                    </Button>

                    <div className="flex-item-fluid-auto w100">
                        <OnboardingPanel />
                    </div>
                </div>

                <Dropdown
                    isOpen={isOpen}
                    anchorRef={anchorRef}
                    autoClose={false}
                    onClose={close}
                    originalPlacement="bottom-start"
                >
                    <DropdownMenu>
                        {ITEM_TYPE_DROPDOWN_BUTTONS.map(({ type, label }) => (
                            <span className={itemTypeToItemClassName[type]} key={`item-type-dropdown-button-${type}`}>
                                <DropdownMenuButton
                                    key={type}
                                    className="flex flex-align-items-center py-2 px-4"
                                    onClick={withClose(() => handleNewItemClick(type))}
                                >
                                    <span
                                        className="mr-2 w-custom h-custom rounded-lg overflow-hidden relative pass-item-icon"
                                        style={{ '--width-custom': `2em`, '--height-custom': `2em` }}
                                    >
                                        <Icon
                                            name={itemTypeToIconName[type]}
                                            className="absolute-center"
                                            color="var(--interaction-norm)"
                                        />
                                    </span>

                                    {label}

                                    {
                                        /* Only show alias count if the user plan
                                         * has an an alias limit. */
                                        type === 'alias' && aliasLimited && (
                                            <span
                                                className={clsx('ml-1', needsUpgrade ? 'color-danger' : 'color-weak')}
                                            >{`(${aliasTotalCount}/${aliasLimit})`}</span>
                                        )
                                    }
                                </DropdownMenuButton>
                            </span>
                        ))}

                        <DropdownMenuButton
                            className="text-left flex flex-align-items-center ui-password"
                            onClick={withClose(handleNewPasswordClick)}
                        >
                            <span
                                className="mr-2 w-custom h-custom rounded-lg overflow-hidden relative pass-item-icon"
                                style={{ '--width-custom': `2em`, '--height-custom': `2em` }}
                            >
                                <Icon name="key" className="absolute-center" color="var(--interaction-norm)" />
                            </span>

                            {c('Label').t`Password`}
                        </DropdownMenuButton>
                    </DropdownMenu>
                </Dropdown>
            </HeaderComponent>
        </>
    );
};
