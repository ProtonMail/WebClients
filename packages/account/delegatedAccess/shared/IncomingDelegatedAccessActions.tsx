import type { APP_NAMES } from '@proton/shared/lib/constants';

import { AccessAction } from './incoming/actions/AccessAction';
import { CancelAction } from './incoming/actions/CancelAction';
import { DeleteAction } from './incoming/actions/DeleteAction';
import { RequestAction } from './incoming/actions/RequestAction';

export const IncomingDelegatedAccessActions = ({ app }: { app: APP_NAMES }) => {
    return (
        <>
            <DeleteAction />
            <RequestAction />
            <CancelAction />
            <AccessAction app={app} />
        </>
    );
};
