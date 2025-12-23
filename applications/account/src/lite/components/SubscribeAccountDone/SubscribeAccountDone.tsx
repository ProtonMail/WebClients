import { c } from 'ttag';

import { SubscribeType } from '../../types/SubscribeType';
import updateSuccess from './updateSuccess.svg';

const SubscribeAccountDone = ({ type }: { type: SubscribeType }) => {
    return (
        <div className="py-14 text-center">
            {type === SubscribeType.Subscribed && (
                <>
                    <img src={updateSuccess} alt="" />
                    <h1 className="text-bold text-2xl my-2">
                        {c('Info').t`Your account has been successfully updated.`}
                    </h1>
                </>
            )}
            <div>{c('Info').t`You can now close this window.`}</div>
        </div>
    );
};

export default SubscribeAccountDone;
