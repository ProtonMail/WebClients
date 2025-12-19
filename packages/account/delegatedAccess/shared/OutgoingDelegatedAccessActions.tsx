import { CreateAction } from './outgoing/actions/CreateAction';
import { DeleteAction } from './outgoing/actions/DeleteAction';
import { EditAction } from './outgoing/actions/EditAction';
import { GrantAction } from './outgoing/actions/GrantAction';
import { ResetAction } from './outgoing/actions/ResetAction';
import { ViewAction } from './outgoing/actions/ViewAction';

export const OutgoingDelegatedAccessActions = () => {
    return (
        <>
            <CreateAction />
            <DeleteAction />
            <EditAction />
            <ViewAction />
            <GrantAction />
            <ResetAction />
        </>
    );
};
