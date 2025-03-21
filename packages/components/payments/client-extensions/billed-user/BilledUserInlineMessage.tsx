import { getBilledUserWarning } from './billedUserWarning';

export const BilledUserInlineMessage = () => {
    return <p>{getBilledUserWarning()}</p>;
};
