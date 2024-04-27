import type { FC } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@proton/atoms/Button';
import { Icon } from '@proton/components/components/icon';
import { TableCell, TableRow } from '@proton/components/components/table';
import type { FetchedBreaches } from '@proton/components/containers';
import ReadableDate from '@proton/components/containers/credentialLeak/ReadableDate';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';

type Props = { breach: FetchedBreaches };

export const BreachListRow: FC<Props> = ({ breach: { id, name, publishedAt } }) => {
    const { getCurrentLocation } = useNavigation();

    return (
        <TableRow>
            <TableCell>{name}</TableCell>
            <TableCell>
                <ReadableDate value={publishedAt} />
            </TableCell>
            <TableCell>
                <div className="m-0 flex justify-end">
                    <Link to={`${getCurrentLocation()}/${id}`}>
                        <Button pill size="small" shape="ghost" type="button">
                            <Icon name="chevron-right" />
                        </Button>
                    </Link>
                </div>
            </TableCell>
        </TableRow>
    );
};
