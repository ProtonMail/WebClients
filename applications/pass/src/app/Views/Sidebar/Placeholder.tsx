import { type FC } from 'react';

import { c } from 'ttag';

type Props = {
    search: string;
    totalCount: number;
    inTrash: boolean;
};

export const ItemsPlaceholder: FC<Props> = ({ search, totalCount, inTrash }) => {
    const empty = totalCount === 0;
    const hasSearch = Boolean(search.trim());

    return (
        <span className="block text-break color-weak text-sm p-2 text-center text-break">
            {(() => {
                if (inTrash) {
                    return empty ? (
                        <span>
                            <strong>{c('Title').t`Trash empty`}</strong>
                            <br /> {c('Info').t`Deleted items will be moved here first`}
                        </span>
                    ) : (
                        <span>
                            {c('Warning').t`No items in trash matching`}
                            <br />"{search}"
                        </span>
                    );
                }

                return hasSearch ? (
                    <span>
                        {c('Warning').t`No items matching`}
                        <br />"{search}"
                    </span>
                ) : (
                    c('Warning').t`No items`
                );
            })()}
        </span>
    );
};
