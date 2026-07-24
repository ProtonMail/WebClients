import { useCallback, useEffect, useRef } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Input } from '@proton/atoms/Input/Input';

import { LumoIcon } from '../../components/LumoIcon/LumoIcon';

interface AllChatsHeaderSearchProps {
    searchQuery: string;
    onSearchQueryChange: (value: string) => void;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export const AllChatsHeaderSearch = ({
    searchQuery,
    onSearchQueryChange,
    isOpen,
    onOpenChange,
}: AllChatsHeaderSearchProps) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            requestAnimationFrame(() => {
                inputRef.current?.focus();
            });
        }
    }, [isOpen]);

    const handleOpen = useCallback(() => {
        onOpenChange(true);
    }, [onOpenChange]);

    const handleClear = useCallback(() => {
        onSearchQueryChange('');
        onOpenChange(false);
    }, [onOpenChange, onSearchQueryChange]);

    if (!isOpen) {
        return (
            <Button
                icon
                shape="ghost"
                color="weak"
                size="medium"
                className="all-chats-header-search-toggle shrink-0"
                aria-label={c('collider_2025:Button').t`Search chats`}
                onClick={handleOpen}
            >
                <LumoIcon name="Search" size={20} />
            </Button>
        );
    }

    return (
        <Input
            ref={inputRef}
            className={clsx('all-chats-header-search-input min-w-0')}
            value={searchQuery}
            onValue={onSearchQueryChange}
            placeholder={c('collider_2025:Placeholder').t`Search chats`}
            aria-label={c('collider_2025:Button').t`Search chats`}
            prefix={<LumoIcon name="Search" size={16} className="color-weak" />}
            suffix={
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
            }
        />
    );
};
