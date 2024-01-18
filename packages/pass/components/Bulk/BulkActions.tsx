import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon } from '@proton/components';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';

export const BulkActions: FC = () => {
    const { matchTrash } = useNavigation();

    return matchTrash ? (
        <>
            <Button shape="solid" size="small" color="weak" icon title={c('Action').t`Bulk restore items from trash`}>
                <Icon name="clock-rotate-left" />
            </Button>
            <Button shape="solid" size="small" color="weak" icon title={c('Action').t`Bulk delete items from trash`}>
                <Icon name="trash-cross" />
            </Button>
        </>
    ) : (
        <>
            <Button
                shape="solid"
                size="small"
                color="weak"
                icon
                title={c('Action').t`Bulk move items to another vault`}
            >
                <Icon name="folder-arrow-in" />
            </Button>
            <Button shape="solid" size="small" color="weak" icon title={c('Action').t`Bulk move items to trash`}>
                <Icon name="trash" />
            </Button>
        </>
    );
};
