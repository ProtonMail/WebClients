import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Prompt } from '@proton/components';
import { BRAND_NAME, PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';

type Props = {
    onClose: () => void;
    open: boolean;
};

export const AliasSimpleLoginNoteModal: FC<Props> = ({ onClose, open }) => {
    return (
        <Prompt
            buttons={
                <Button pill onClick={onClose} className="w-full" shape="solid" color="weak">
                    {c('Action').t`OK`}
                </Button>
            }
            className="text-left"
            onClose={onClose}
            open={open}
            title={c('Title').t`What is the difference between ${PASS_SHORT_APP_NAME} note and SimpleLogin note?`}
            enableCloseWhenClickOutside
        >
            <div>{c('Info')
                .t`In ${PASS_SHORT_APP_NAME}, an item note is encrypted with the item encryption key and only users who have access to the item can view the note. Not even ${BRAND_NAME} or SimpleLogin can see it.`}</div>
            <div>{c('Info')
                .t`SimpleLogin note is stored together in the same location with alias address and while it is protected by encryption at rest, it isn't E2E encrypted meaning anyone who has access to SimpleLogin database can read it.`}</div>
        </Prompt>
    );
};
