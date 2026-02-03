import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Input } from '@proton/atoms/Input/Input';
import { IcMagnifier } from '@proton/icons/icons/IcMagnifier';

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
        <div className="flex items-center w-full side-bar-search">
            <IcMagnifier className="color-norm shrink-0 ml-2" size={6} />
            <Input
                value={searchExpression}
                onChange={(e) => setSearchExpression(e.target.value)}
                unstyled={true}
                className="flex-1"
                placeholder={placeholder}
                autoFocus
                inputClassName="text-ellipsis ml-0.5 pr-1 mr-0"
            />
            <Button
                className="search-cancel-button ml-2 flex items-center justify-center text-hint color-primary rounded-full shrink-0 px-1"
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
