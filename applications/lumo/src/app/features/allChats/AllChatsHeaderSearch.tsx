import { useCallback, useEffect, useRef } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Input } from '@proton/atoms/Input/Input';

import { LumoIcon } from '../../components/LumoIcon/LumoIcon';

interface Props {
    searchQuery: string;
    onSearchQueryChange: (value: string) => void;
}

export const AllChatsHeaderSearch = ({ searchQuery, onSearchQueryChange }: Props) => {
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
        // Input grows by default (flex-1), so the wrapper sets its width: the full row on small
        // screens, 280px beside the title above that.
        <div className="w-full md:w-custom shrink-0" style={{ '--md-w-custom': '17.5rem' }}>
            <Input
                ref={inputRef}
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
        </div>
    );
};
