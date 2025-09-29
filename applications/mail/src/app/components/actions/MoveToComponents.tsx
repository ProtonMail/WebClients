import type { PropsWithChildren } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';

interface MoveToPlaceholdersProps {
    emptyListCopy: string;
    search: string;
}

export const MoveToPlaceholders = ({ search, emptyListCopy }: MoveToPlaceholdersProps) => {
    const content = search ? (
        <p data-testid="move-to-no-results" className="color-hint text-sm">{c('Label').t`No results found`}</p>
    ) : (
        <p data-testid="move-to-empty-list" key="empty" className="color-hint text-sm">
            {`${emptyListCopy}`}
        </p>
    );

    return <div className="flex items-center justify-center h-full">{content}</div>;
};

export const MoveToDivider = () => {
    return <hr className="bg-weak m-0 shrink-0" />;
};

interface MoveToDropdownButtonsProps {
    loading: boolean;
    disabled: boolean;
    onClose: () => void;
    ctaText: string;
}

export const MoveToDropdownButtons = ({ loading, disabled, onClose, ctaText }: MoveToDropdownButtonsProps) => {
    return (
        <div className="mt-4 shrink-0">
            <Button
                fullWidth
                color="norm"
                className="mb-2"
                loading={loading}
                disabled={disabled}
                data-testid="move-to-apply"
                data-prevent-arrow-navigation
                type="submit"
            >
                {ctaText}
            </Button>
            <Button fullWidth data-testid="move-to-cancel" data-prevent-arrow-navigation onClick={() => onClose()}>
                {c('Action').t`Cancel`}
            </Button>
        </div>
    );
};

export const MoveToFolderFooterWrapper = ({ children }: PropsWithChildren) => {
    return <div className="mx-6 mb-6 mt-4 shrink-0">{children}</div>;
};

interface Props extends PropsWithChildren {
    testid: string;
}

export const MoveToContentWrapper = ({ testid, children }: Props) => {
    return (
        <div
            className="flex-auto overflow-auto scrollbar-always-visible max-h-custom min-h-custom"
            style={{
                '--max-h-custom': '13.5em',
                '--min-h-custom': '11em',
            }}
            data-testid={testid}
        >
            {children}
        </div>
    );
};

interface CreateNewButtonProps {
    copy: string;
    onClick: () => void;
    testid: string;
}

export const ButtonCreateNewItem = ({ copy, onClick, testid }: CreateNewButtonProps) => {
    return (
        <Button
            fullWidth
            onClick={onClick}
            shape="ghost"
            className="text-left flex item-start my-2 py-2 px-6 rounded-none"
            data-testid={testid}
            data-prevent-arrow-navigation
        >
            <Icon name="plus" className="mr-2 mt-0.5" />
            <span className="flex-1">{copy}</span>
        </Button>
    );
};
