import { c } from 'ttag';

import { SubscribeType } from '../../types/SubscribeType';
import updateSuccess from './updateSuccess.svg';

const SubscribeAccountDone = ({ type }: { type: SubscribeType }) => {
    const successText = c('Info').t`Account successfully updated`;
    return (
        <div className="text-center">
            {type === SubscribeType.Subscribed && (
                <div className="mb-4">
                    <h3 className="text-bold text-xl">{successText}</h3>
                    <img src={updateSuccess} alt={successText} />
                </div>
            )}
            <div>{c('Info').t`You can now close this window.`}</div>
        </div>
    );
};

export default SubscribeAccountDone;
