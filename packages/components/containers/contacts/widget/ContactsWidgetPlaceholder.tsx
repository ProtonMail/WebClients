import React, { ReactNode, MouseEvent } from 'react';
import { c } from 'ttag';
import noContactsImgLight from 'design-system/assets/img/shared/empty-address-book.svg';
import noContactsImgDark from 'design-system/assets/img/shared/empty-address-book-dark.svg';
import noResultsImgLight from 'design-system/assets/img/shared/no-result-search.svg';
import noResultsImgDark from 'design-system/assets/img/shared/no-result-search-dark.svg';
import { getLightOrDark } from 'proton-shared/lib/themes/helpers';
import { IllustrationPlaceholder } from '../../illustration';
import { LinkButton } from '../../../components';

export enum EmptyType {
    All,
    Search,
}

interface ActionLinkProps {
    onClick: (event: MouseEvent) => void;
    children: ReactNode;
}

const ActionLink = ({ onClick, children }: ActionLinkProps) => {
    return (
        <LinkButton onClick={onClick} className="ml0-25 mr0-25">
            {children}
        </LinkButton>
    );
};

interface Props {
    type: EmptyType | undefined;
    onClearSearch: (event: MouseEvent) => void;
    onImport: () => void;
    onCreate: () => void;
}

const ContactsWidgetPlaceholder = ({ type, onClearSearch, onImport, onCreate }: Props) => {
    let imgUrl: string;
    let actions: ReactNode;

    switch (type) {
        case EmptyType.Search: {
            imgUrl = getLightOrDark(noResultsImgLight, noResultsImgDark);
            actions = (
                <div className="flex flex-column">
                    <p className="m0">{c('Actions message').t`No results found.`}</p>
                    <p className="m0">{c('Actions message').jt`Please try another search term.`}</p>
                    <p className="m0">
                        <ActionLink onClick={onClearSearch}>{c('Action').t`Clear query`}</ActionLink>
                    </p>
                </div>
            );
            break;
        }
        case EmptyType.All:
        default: {
            imgUrl = getLightOrDark(noContactsImgLight, noContactsImgDark);
            const addContact = (
                <ActionLink key="add-contact" onClick={onCreate}>{c('Action').t`Add contact`}</ActionLink>
            );
            const importContact = (
                <ActionLink key="import" onClick={onImport}>
                    {c('Action').t`import`}
                </ActionLink>
            );
            actions = (
                <div className="flex flex-column">
                    <p className="m0">{c('Actions message').t`You don't have any contacts.`}</p>
                    <p className="m0">{c('Actions message').jt`${addContact} or ${importContact}.`}</p>
                </div>
            );
        }
    }

    return (
        <div className="p2 text-center w100">
            <IllustrationPlaceholder illustrationClassName="w40" url={imgUrl}>
                <div className="flex flex-align-items-center">{actions}</div>
            </IllustrationPlaceholder>
        </div>
    );
};

export default ContactsWidgetPlaceholder;
