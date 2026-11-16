import type { FC } from 'react';
import { Link, useHistory, useParams } from 'react-router-dom';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import TableCell from '@proton/components/components/table/TableCell';
import TableRow from '@proton/components/components/table/TableRow';
import ReadableDate from '@proton/components/containers/credentialLeak/ReadableDate';
import { getBreachIcon } from '@proton/components/containers/credentialLeak/helpers';
import type { FetchedBreaches } from '@proton/components/containers/credentialLeak/models';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';

import { getLocalPath } from '../../../Navigation/routing';

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
                    <ButtonLike
                        as={Link}
                        // ButtonLike adds role="button" when as={Link} has onClick; this renders an <a>, so restore its link role
                        // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
                        role="link"
                        to={breachHref}
                        onClick={(evt: React.MouseEvent) => evt.stopPropagation()}
                        aria-label={c('Action').t`View details`}
                        pill
                        size="small"
                        shape="ghost"
                    >
                        <IcChevronRight />
                    </ButtonLike>
                </div>
            </TableCell>
        </TableRow>
    );
};
