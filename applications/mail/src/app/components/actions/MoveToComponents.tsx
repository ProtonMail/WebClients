import { c } from 'ttag';

import { Button } from '@proton/atoms';

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
}

export const MoveToDropdownButtons = ({ loading, disabled, onClose }: MoveToDropdownButtonsProps) => {
    return (
        <div className="m-4 shrink-0">
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
                {c('Action').t`Move`}
            </Button>
            <Button fullWidth data-testid="move-to-cancel" data-prevent-arrow-navigation onClick={() => onClose()}>
                {c('Action').t`Cancel`}
            </Button>
        </div>
    );
};
