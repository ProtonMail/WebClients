import type { FC } from 'react';

import cogIcon from 'proton-authenticator/assets/cog.svg';
import { useAppSelector } from 'proton-authenticator/store/utils';
import { c } from 'ttag';

import { Button, CircleLoader, Input } from '@proton/atoms';
import { Icon } from '@proton/components';

type NavbarProps = {
    search: string;
    handleNewClick: () => void;
    setSearch: (value: string) => void;
    setSettingsOpen: (value: boolean) => void;
};

export const Navbar: FC<NavbarProps> = ({ search, handleNewClick, setSearch, setSettingsOpen }) => {
    const syncState = useAppSelector((s) => s.auth.syncState);

    const handleClear = () => setSearch('');

    return (
        <nav className="navbar flex w-full items-center gap-2 sm:gap-4">
            <Button
                pill
                icon
                size="small"
                shape="solid"
                color="norm"
                onClick={handleNewClick}
                title={c('authenticator-2025:Action').t`Create a new vault`}
                className="flex items-center p-2 sm:py-1.5 sm:px-4 cta-button shrink-0"
            >
                <Icon name="plus" alt="" className="shrink-0 mr-0 sm:mr-2" size={4} />
                <span className="hidden sm:block text-ellipsis">{c('authenticator-2025:Label').t`Add`}</span>
            </Button>

            <div className="flex-1 min-w-0 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
                <Input
                    autoFocus
                    className="rounded-full w-full"
                    inputClassName="text-rg"
                    onValue={setSearch}
                    placeholder={c('authenticator-2025:Action').t`Search`}
                    prefix={<Icon name="magnifier" />}
                    suffix={
                        search !== '' && (
                            <Button
                                icon
                                pill
                                size="small"
                                shape="ghost"
                                color="weak"
                                onClick={handleClear}
                                title={c('authenticator-2025:Action').t`Clear search`}
                            >
                                <Icon name="cross" />
                            </Button>
                        )
                    }
                    value={search}
                    name="search"
                />
            </div>

            {syncState === 'loading' && <CircleLoader />}

            <Button
                icon
                pill
                shape="ghost"
                color="weak"
                onClick={() => setSettingsOpen(true)}
                title={c('authenticator-2025:Action').t`Open settings`}
                className="shrink-0"
            >
                <img src={cogIcon} alt="" className="light-invert" />
            </Button>
        </nav>
    );
};
