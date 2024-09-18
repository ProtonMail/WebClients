import type { FC } from 'react';
import { Link, useHistory, useParams } from 'react-router-dom';

import { Button } from '@proton/atoms';
import type { FetchedBreaches } from '@proton/components';
import { TableCell, TableRow } from '@proton/components';
import Icon from '@proton/components/components/icon/Icon';
import ReadableDate from '@proton/components/containers/credentialLeak/ReadableDate';
import { getBreachIcon } from '@proton/components/containers/credentialLeak/helpers';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';

type Props = { breach: FetchedBreaches };

export const BreachListRow: FC<Props> = ({ breach: { id, name, publishedAt, severity, resolvedState } }) => {
    const history = useHistory();
    const { addressId, type } = useParams<{ addressId: string; type: string }>();
    const breachIcon = getBreachIcon(severity, { resolved: resolvedState > 2 });
    const breachHref = getLocalPath(`monitor/dark-web/${type}/${addressId}/${id}`);

    const handleClick = () => history.push(breachHref);

    return (
        <TableRow className="pass-table--row" onClick={handleClick}>
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
                    <Link to={breachHref} onClick={(evt) => evt.stopPropagation()}>
                        <Button pill size="small" shape="ghost" type="button">
                            <Icon name="chevron-right" />
                        </Button>
                    </Link>
                </div>
            </TableCell>
        </TableRow>
    );
};
