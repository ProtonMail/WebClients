import { useCallback, useEffect, useRef } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Input } from '@proton/atoms/Input/Input';

import { LumoIcon } from '../../components/LumoIcon/LumoIcon';

interface AllChatsHeaderSearchProps {
    searchQuery: string;
    onSearchQueryChange: (value: string) => void;
}

export const AllChatsHeaderSearch = ({ searchQuery, onSearchQueryChange }: AllChatsHeaderSearchProps) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        requestAnimationFrame(() => {
            inputRef.current?.focus();
        });
    }, []);

    const handleClear = useCallback(() => {
        onSearchQueryChange('');

        requestAnimationFrame(() => {
            inputRef.current?.focus();
        });
    }, [onSearchQueryChange]);

    return (
        <Input
            ref={inputRef}
            className="all-chats-header-search-input min-w-0 ml-0 md:ml-2"
            value={searchQuery}
            onValue={onSearchQueryChange}
            placeholder={c('collider_2025:Placeholder').t`Search chats`}
            aria-label={c('collider_2025:Button').t`Search chats`}
            prefix={<LumoIcon name="Search" size={16} className="color-weak" />}
            suffix={
                searchQuery ? (
                    <Button
                        icon
                        shape="ghost"
                        size="small"
                        className="shrink-0"
                        aria-label={c('collider_2025:Action').t`Clear search`}
                        onClick={handleClear}
                    >
                        <LumoIcon name="X" size={16} />
                    </Button>
                ) : null
            }
        />
    );
};
