import { type VFC, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { useItemsFilteringContext } from 'proton-pass-extension/lib/hooks/useItemsFilteringContext';
import { useOnboardingMessage } from 'proton-pass-extension/lib/hooks/useOnboardingMessage';
import { usePopupContext } from 'proton-pass-extension/lib/hooks/usePopupContext';
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
import { DropdownMenuButtonLabel } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { itemTypeToIconName } from '@proton/pass/components/Layout/Icon/ItemIcon';
import { itemTypeToSubThemeClassName } from '@proton/pass/components/Layout/Theme/types';
import { usePasswordContext } from '@proton/pass/components/PasswordGenerator/PasswordContext';
import { Spotlight } from '@proton/pass/components/Spotlight/Spotlight';
import { useCopyToClipboard } from '@proton/pass/hooks/useCopyToClipboard';
import { passwordSave } from '@proton/pass/store/actions/creators/pw-history';
import { selectAliasLimits, selectPassPlan } from '@proton/pass/store/selectors';
import type { ItemType } from '@proton/pass/types';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { pipe } from '@proton/pass/utils/fp';
import { uniqueId } from '@proton/pass/utils/string';
import { getEpoch } from '@proton/pass/utils/time';

import { MenuDropdown } from './MenuDropdown';
import { Searchbar } from './Searchbar';

type QuickAddAction = { label: string; type: ItemType };

export const Header: VFC<{}> = () => {
    const history = useHistory();
    const dispatch = useDispatch();
    const { ready, context } = usePopupContext();
    const { search, setSearch } = useItemsFilteringContext();
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const { generatePassword } = usePasswordContext();
    const withClose = <T extends (...args: any[]) => void>(action: T) => pipe(action, close) as T;
    const copyToClipboard = useCopyToClipboard();
    const { needsUpgrade, aliasLimit, aliasLimited, aliasTotalCount } = useSelector(selectAliasLimits);
    const isFreePlan = useSelector(selectPassPlan) === UserPassPlan.FREE;
    const onboarding = useOnboardingMessage();

    const handleNewItemClick = (type: ItemType) => {
        /* Trick to be able to return to the initial route using
         * history.goBack() if user switches from iteam creation
         * routes for multiple subsequent item types. */
        const shouldReplace = history.location.pathname.includes('/item/new/');
        history[shouldReplace ? 'replace' : 'push'](`/item/new/${type}`);
    };

    const handleNewPasswordClick = () => {
        void generatePassword({
            actionLabel: c('Action').t`Copy and close`,
            className: 'ui-red',
            onSubmit: (password) => {
                const { domain, subdomain, hostname } = context?.url ?? {};
                const url = subdomain ?? domain ?? hostname ?? null;

                dispatch(
                    passwordSave({
                        id: uniqueId(),
                        value: password,
                        origin: url,
                        createTime: getEpoch(),
                    })
                );

                void copyToClipboard(password);
            },
        });
    };

    const quickAddActions = useMemo<QuickAddAction[]>(
        () => [
            { label: c('Label').t`Login`, type: 'login' },
            { label: c('Label').t`Alias`, type: 'alias' },
            { label: c('Label').t`Credit Card`, type: 'creditCard' },
            { label: c('Label').t`Note`, type: 'note' },
        ],
        []
    );

    return (
        <>
            <HeaderComponent className="border-bottom h-auto p-2">
                <div className="flex flex-align-items-center gap-x-2 w-full">
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

                    <div className="flex-item-fluid-auto w-full">
                        <Spotlight {...onboarding} />
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
                        {quickAddActions.map(({ type, label }) => (
                            <DropdownMenuButton
                                key={`item-type-dropdown-button-${type}`}
                                className={itemTypeToSubThemeClassName[type]}
                                onClick={withClose(() => handleNewItemClick(type))}
                                disabled={isFreePlan && type === 'creditCard'}
                            >
                                <DropdownMenuButtonLabel
                                    label={label}
                                    extra={
                                        type === 'alias' && aliasLimited ? (
                                            <span
                                                className={needsUpgrade ? 'color-danger' : 'color-weak'}
                                            >{`(${aliasTotalCount}/${aliasLimit})`}</span>
                                        ) : undefined
                                    }
                                    icon={
                                        <span
                                            className="mr-2 w-custom h-custom rounded-lg overflow-hidden relative pass-item-icon flex-item-noshrink"
                                            style={{ '--w-custom': `2em`, '--h-custom': `2em` }}
                                        >
                                            <Icon
                                                name={itemTypeToIconName[type]}
                                                className="absolute-center"
                                                color="var(--interaction-norm)"
                                            />
                                        </span>
                                    }
                                />
                            </DropdownMenuButton>
                        ))}

                        <DropdownMenuButton className="ui-red" onClick={withClose(handleNewPasswordClick)}>
                            <DropdownMenuButtonLabel
                                label={c('Label').t`Password`}
                                icon={
                                    <span
                                        className="mr-2 w-custom h-custom rounded-lg overflow-hidden relative pass-item-icon flex-item-noshrink"
                                        style={{ '--w-custom': `2em`, '--h-custom': `2em` }}
                                    >
                                        <Icon name="key" className="absolute-center" color="var(--interaction-norm)" />
                                    </span>
                                }
                            />
                        </DropdownMenuButton>
                    </DropdownMenu>
                </Dropdown>
            </HeaderComponent>
        </>
    );
};
