import { c } from 'ttag';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { AlertModal, AlertModalProps, Button } from '../../../components';

const SubscriptionModalDisabled = (props: Omit<AlertModalProps, 'title' | 'buttons' | 'children'>) => {
    return (
        <AlertModal
            {...props}
            title={c('Title').t`Refresh your browser`}
            buttons={
                <Button color="norm" onClick={() => window.location.reload()}>{c('Action').t`Refresh browser`}</Button>
            }
        >
            <div className="text-pre-wrap">
                {c('Info')
                    .t`Get the latest version of ${BRAND_NAME} and all relevant updates by refreshing your browser.`}
            </div>
        </AlertModal>
    );
};

export default SubscriptionModalDisabled;
