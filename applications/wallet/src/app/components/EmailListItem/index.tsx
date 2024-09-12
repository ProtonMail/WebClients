import type { ReactNode } from 'react';

import { CircleLoader } from '@proton/atoms/CircleLoader';
import { Marks } from '@proton/components';
import type { MatchChunk } from '@proton/shared/lib/helpers/regex';
import { getInitials } from '@proton/shared/lib/helpers/string';

import { Avatar } from '../../atoms';
import { getThemeByIndex } from '../../utils';

interface EmailListItemProps {
    index: number;
    chunks?: MatchChunk[];
    name?: string;
    address: string;
    onClick?: () => void;
    leftNode?: ReactNode;
    rightNode?: ReactNode;
    loading?: boolean;
    reviewStep?: boolean;
}

export const EmailListItem = ({
    index,
    chunks = [],
    name,
    address,
    loading,
    leftNode,
    rightNode,
    onClick,
    reviewStep,
}: EmailListItemProps) => {
    const inner = (
        <>
            {leftNode}
            {loading ? (
                <CircleLoader className="color-primary" />
            ) : (
                <>
                    <Avatar subTheme={getThemeByIndex(index)}>{getInitials(name || address)}</Avatar>
                    <div className="flex flex-column justify-center items-center mr-auto">
                        <span className="block w-full text-ellipsis text-left text-lg">
                            {<Marks chunks={chunks}>{name || address}</Marks>}
                        </span>
                        {Boolean(name && address) && name !== address && (
                            <span className="block w-full text-ellipsis text-left color-hint">
                                {<Marks chunks={chunks}>{address}</Marks>}
                            </span>
                        )}
                    </div>
                </>
            )}
            {rightNode}
        </>
    );

    if (onClick) {
        return (
            <button
                onClick={onClick}
                className="dropdown-item-button email-select-button flex flex-row w-full flex-nowrap items-center grow p-2 rounded-lg h-custom"
                style={{ '--h-custom': '4.875rem' }}
            >
                {inner}
            </button>
        );
    }

    return (
        <div
            className="flex flex-row w-full flex-nowrap items-center grow py-2 rounded-lg h-custom"
            style={{ '--h-custom': '4.875rem' }}
        >
            {inner}
            {reviewStep && <hr className="my-2" />}
        </div>
    );
};
