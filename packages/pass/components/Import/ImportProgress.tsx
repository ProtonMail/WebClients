import { type FC } from 'react';
import { useSelector } from 'react-redux';

import { c, msgid } from 'ttag';

import { CircleLoader } from '@proton/atoms';
import { itemsImportRequest } from '@proton/pass/store/actions/requests';
import { selectRequest } from '@proton/pass/store/selectors';

/* we need to pass the runtime port object to this component
 * as it may be loaded inside a Portal outside of the extension
 * context provider's children  */
export const ImportProgress: FC<{ total: number }> = ({ total }) => {
    const req = useSelector(selectRequest(itemsImportRequest()));
    const progress = req?.status === 'start' ? req.progress ?? 0 : 0;

    return (
        <>
            {c('Info').t`Import in progress:`}{' '}
            <strong className="mx-2">
                {progress}/{total} {c('Info').ngettext(msgid`item`, `items`, total)}
            </strong>
            <CircleLoader />
        </>
    );
};
