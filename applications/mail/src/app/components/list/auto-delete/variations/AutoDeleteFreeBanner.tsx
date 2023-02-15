import React from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { AutoDeleteUpsellModal, useModalState } from '@proton/components/components';
import { PromotionBanner } from '@proton/components/containers';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import type { AutoDeleteLabelIDs } from '../interface';

interface Props {
    labelID: AutoDeleteLabelIDs;
}

const AutoDeleteFreeBanner = ({ labelID }: Props) => {
    const [upsellModalProps, toggleUpsellModal, renderUpsellModal] = useModalState();

    const message: string = (() => {
        switch (labelID) {
            case MAILBOX_LABEL_IDS.TRASH:
                return c('Info')
                    .t`Upgrade to automatically delete messages that have been in trash for more than 30 days.`;
            case MAILBOX_LABEL_IDS.SPAM:
                return c('Info')
                    .t`Upgrade to automatically delete messages that have been in spam for more than 30 days.`;
        }
    })();

    return (
        <>
            {renderUpsellModal && <AutoDeleteUpsellModal modalProps={upsellModalProps} />}
            <PromotionBanner
                contentCentered
                description={message}
                data-testid="auto-delete:banner:free"
                cta={
                    <Button
                        type="button"
                        className="text-bold"
                        shape="underline"
                        color="norm"
                        onClick={() => {
                            toggleUpsellModal(true);
                        }}
                    >
                        {c('Action').t`Upgrade`}
                    </Button>
                }
            />
        </>
    );
};

export default AutoDeleteFreeBanner;
