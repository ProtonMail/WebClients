import { useEffect } from 'react';
import { useRef } from 'react';

import { c } from 'ttag';

import { Button, Input } from '@proton/atoms';
import { IcCross } from '@proton/icons';

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
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    return (
        <div className="mb-4 flex items-center w-full">
            <Input
                ref={inputRef}
                value={searchExpression}
                onChange={(e) => setSearchExpression(e.target.value)}
                unstyled={true}
                className="flex-1"
                placeholder={placeholder}
            />
            <Button
                className="p-0 ml-2 flex items-center justify-center text-disabled"
                shape="ghost"
                size="small"
                onClick={() => {
                    setIsSearchOn(false);
                    setSearchExpression('');
                }}
                aria-label={c('l10n_nightly Alt').t`Close search`}
            >
                <IcCross size={6} />
            </Button>
        </div>
    );
};
