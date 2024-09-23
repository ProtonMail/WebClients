import type { MouseEvent } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import BasicModal from '@proton/components/components/modalTwo/BasicModal';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { ACCESS_LEVEL } from '@proton/shared/lib/interfaces/calendar';

interface Props {
    link: string;
    onSubmit: (e: MouseEvent<HTMLButtonElement>) => void;
    onClose: () => void;
    accessLevel: ACCESS_LEVEL;
    isOpen: boolean;
}

const ShareLinkSuccessModal = ({ link, onSubmit, onClose, accessLevel, isOpen }: Props) => {
    return (
        <BasicModal
            title={c('Title').t`Your calendar link`}
            footer={
                <>
                    <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>
                    <Button className="ml-auto" onClick={onSubmit} color="norm">{c('Action').t`Copy link`}</Button>
                </>
            }
            size="medium"
            onClose={onClose}
            isOpen={isOpen}
        >
            <div className="color-weak">
                {accessLevel === ACCESS_LEVEL.FULL ? (
                    <>
                        <p className="mt-0">{c('Info')
                            .t`By sharing the full event details of this calendar, you accept to grant ${BRAND_NAME} access to this calendar's encrypted information.`}</p>
                        <p>{c('Info')
                            .t`Anyone with this link can see all the event details of this calendar such as title, location or participants.`}</p>
                    </>
                ) : (
                    <p className="mt-0">
                        {c('Info')
                            .t`Anyone with this link can see whether you’re free or busy on your calendar. They can’t see event details, such as title, location, or participants.`}
                    </p>
                )}
            </div>
            <label htmlFor="your-calendar-url" className="sr-only">
                {c('Label').t`Your calendar URL`}
            </label>
            <div className="border p-4 rounded text-break-all">{link}</div>
        </BasicModal>
    );
};

export default ShareLinkSuccessModal;
