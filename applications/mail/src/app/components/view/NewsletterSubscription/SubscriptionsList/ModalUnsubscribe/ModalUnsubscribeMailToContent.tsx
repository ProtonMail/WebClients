import { c } from 'ttag';

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleHeader,
    CollapsibleHeaderIconButton,
    Icon,
} from '@proton/components';

import { getUnsubscribeMethod } from '../../helper';
import { type PropsWithNewsletterSubscription, UnsubscribeMethod } from '../../interface';

export const ModalUnsubscribeMailToContent = ({ subscription }: PropsWithNewsletterSubscription) => {
    const unsubscribeMethod = getUnsubscribeMethod(subscription);
    if (unsubscribeMethod !== UnsubscribeMethod.Mailto) {
        return null;
    }

    const {
        Subject = 'Unsubscribe',
        Body = 'Please, unsubscribe me',
        ToList = [],
    } = subscription.UnsubscribeMethods.Mailto || {};

    return (
        <div className="border border-weak rounded p-1 max-w-full mb-4">
            <div className="flex flex-nowrap gap-2 pl-1 py-1">
                <Icon name="info-circle" className="shrink-0 mt-0.5 color-info" />
                <div className="flex-1 text-sm max-w-full">
                    {c('Info').t`An unsubscribe email will be sent on your behalf.`}

                    <Collapsible>
                        <CollapsibleHeader
                            className="color-weak text-sm"
                            suffix={
                                <CollapsibleHeaderIconButton>
                                    <Icon name="chevron-down" size={3} />
                                </CollapsibleHeaderIconButton>
                            }
                        >
                            {c('Title').t`Email content`}
                        </CollapsibleHeader>
                        <CollapsibleContent className="text-sm max-w-full text-ellipsis">
                            <div className="mb-2 flex flex-column gap1">
                                <strong>{c('Label').t`To:`}</strong>
                                <span className="text-ellipsis max-w-full">{ToList.join(', ')}</span>
                            </div>
                            <div className="mb-2 flex flex-column gap1">
                                <strong>{c('Label').t`Subject:`}</strong>
                                <span className="text-ellipsis max-w-full">{Subject}</span>
                            </div>
                            <div className="mb-2 flex flex-column gap1">
                                <strong>{c('Label').t`Message:`}</strong>
                                <span className="text-ellipsis max-w-full">{Body}</span>
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                </div>
            </div>
        </div>
    );
};
