import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

export const CancelSSOButton = ({ onClick }: { onClick: () => void }) => (
    <Button size="large" type="button" shape="ghost" color="norm" fullWidth className="mt-2" onClick={onClick}>
        {c('Action').t`Cancel`}
    </Button>
);
