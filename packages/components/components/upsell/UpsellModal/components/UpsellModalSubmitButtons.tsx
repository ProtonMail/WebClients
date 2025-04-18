import { c } from 'ttag';

import { Button } from '@proton/atoms/index';

export const UpsellModalComposerAssistantSubmitButton = (closeModal: () => void) => (
    <Button
        size="large"
        color="norm"
        shape="solid"
        fullWidth
        onClick={() => {
            closeModal();
        }}
    >
        {c('Action').t`Close`}
    </Button>
);
