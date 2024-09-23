import type { MouseEvent, ReactNode } from 'react';

import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms';
import noResultsImg from '@proton/styles/assets/img/illustrations/empty-search.svg';
import noContactsImg from '@proton/styles/assets/img/illustrations/no-contacts.svg';

import IllustrationPlaceholder from '../../illustration/IllustrationPlaceholder';

export enum EmptyType {
    All,
    Search,
    AllGroups,
}

interface Props {
    type: EmptyType | undefined;
    onClearSearch: (event: MouseEvent) => void;
    onCreate: () => void;
    onImport: () => void;
}

const ContactsWidgetPlaceholder = ({ type, onClearSearch, onImport, onCreate }: Props) => {
    let imgUrl: string;
    let actions: ReactNode;

    switch (type) {
        case EmptyType.AllGroups: {
            imgUrl = noContactsImg;
            actions = (
                <div className="flex flex-column">
                    <p className="m-0" data-testid="groups:no-groups">{c('Actions message')
                        .t`You don't have any groups.`}</p>
                    <p className="m-0">
                        <InlineLinkButton key="add-contact" onClick={onCreate}>{c('Action')
                            .t`Add group`}</InlineLinkButton>
                    </p>
                </div>
            );
            break;
        }
        case EmptyType.Search: {
            imgUrl = noResultsImg;
            actions = (
                <div className="flex flex-column">
                    <p className="m-0">{c('Actions message').t`No results found.`}</p>
                    <p className="m-0">{c('Actions message').jt`Please try another search term.`}</p>
                    <p className="m-0">
                        <InlineLinkButton onClick={onClearSearch}>{c('Action').t`Clear query`}</InlineLinkButton>
                    </p>
                </div>
            );
            break;
        }
        case EmptyType.All:
        default: {
            imgUrl = noContactsImg;
            const addContact = (
                <InlineLinkButton key="add-contact" onClick={onCreate}>{c('Action').t`Add contact`}</InlineLinkButton>
            );
            const importContact = (
                <InlineLinkButton key="import" onClick={onImport}>
                    {c('Action').t`import`}
                </InlineLinkButton>
            );
            actions = (
                <div className="flex flex-column">
                    <p className="m-0" data-testid="contacts:no-contacts">{c('Actions message')
                        .t`You don't have any contacts.`}</p>
                    <p className="m-0">{c('Actions message').jt`${addContact} or ${importContact}.`}</p>
                </div>
            );
        }
    }

    return (
        <div className="p-7 text-center w-full">
            <IllustrationPlaceholder url={imgUrl}>
                <div className="flex items-center">{actions}</div>
            </IllustrationPlaceholder>
        </div>
    );
};

export default ContactsWidgetPlaceholder;
