import { CreateAction } from './outgoing/actions/CreateAction';
import { DeleteAction } from './outgoing/actions/DeleteAction';
import { EditAction } from './outgoing/actions/EditAction';
import { GrantAction } from './outgoing/actions/GrantAction';
import { ReEnableAction } from './outgoing/actions/ReEnableAction';
import { RecoverAction } from './outgoing/actions/RecoverAction';
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
            <ReEnableAction />
            <ResetAction />
            <RecoverAction />
        </>
    );
};
