import { c } from 'ttag';
import { Alert, ConfirmModal } from '@proton/components';

const RecurringMatchWarning = (props: any) => {
    return (
        <ConfirmModal
            confirm={c('Action').t`Update`}
            title={c('Info').t`Update recurring event`}
            cancel={c('Action').t`Cancel`}
            {...props}
        >
            <Alert className="mb1" type="warning">{c('Recurring update')
                .t`Specific changes on single events of this series will be reverted.`}</Alert>
        </ConfirmModal>
    );
};

export default RecurringMatchWarning;
