import { c } from 'ttag';

import { Button, Input } from '@proton/atoms';
import { IcMagnifier } from '@proton/icons';

import './SideBarSearch.scss';

interface SideBarSearchProps {
    searchExpression: string;
    setSearchExpression: (value: string) => void;
    setIsSearchOn: (value: boolean) => void;
    placeholder?: string;
}

export const SideBarSearch = ({
    searchExpression,
    setSearchExpression,
    setIsSearchOn,
    placeholder,
}: SideBarSearchProps) => {
    return (
        <div className="flex items-center w-full gap-2 side-bar-search">
            <IcMagnifier className="color-norm" size={6} />
            <Input
                value={searchExpression}
                onChange={(e) => setSearchExpression(e.target.value)}
                unstyled={true}
                className="flex-1"
                placeholder={placeholder}
                autoFocus
            />
            <Button
                className="search-cancel-button ml-2 flex items-center justify-center text-hint color-primary rounded-full"
                shape="ghost"
                size="small"
                onClick={() => {
                    setIsSearchOn(false);
                    setSearchExpression('');
                }}
                aria-label={c('Alt').t`Close search`}
            >
                {c('Action').t`Cancel`}
            </Button>
        </div>
    );
};
