import { type FC, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Prompt from '@proton/components/components/prompt/Prompt';
import { InfoButton } from '@proton/pass/components/Layout/Button/InfoButton';
import { BRAND_NAME, PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';

export const AliasSLNoteLabel: FC = () => {
    const [open, setOpen] = useState(false);
    const onClose = () => setOpen(false);

    return (
        <>
            <span className="flex items-center flex-nowrap gap-1">
                {c('Label').t`Note • SimpleLogin`}
                <InfoButton
                    onClick={(e) => {
                        e.stopPropagation(); /* Prevent copying note to clipboard */
                        setOpen(true);
                    }}
                />
            </span>
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
        </>
    );
};
