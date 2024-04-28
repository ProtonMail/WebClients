import type { FC } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@proton/atoms/Button';
import { Icon } from '@proton/components/components/icon';
import { TableCell, TableRow } from '@proton/components/components/table';
import type { FetchedBreaches } from '@proton/components/containers';
import ReadableDate from '@proton/components/containers/credentialLeak/ReadableDate';
import { getBreachIcon } from '@proton/components/containers/credentialLeak/helpers';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';

type Props = { breach: FetchedBreaches };

export const BreachListRow: FC<Props> = ({ breach: { id, name, publishedAt, severity, resolvedState } }) => {
    const { getCurrentLocation } = useNavigation();
    const breachIcon = getBreachIcon(severity, { resolved: resolvedState > 2 });

    return (
        <TableRow>
            <TableCell>
                <div className="flex flex-nowrap gap-2">
                    <img src={breachIcon} alt="" className="shrink-0 w-custom" style={{ '--w-custom': '1.5em' }} />
                    <span className="text-ellipsis">{name}</span>
                </div>
            </TableCell>
            <TableCell>
                <ReadableDate value={publishedAt} className="text-ellipsis" />
            </TableCell>
            <TableCell>
                <div className="flex justify-end">
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
