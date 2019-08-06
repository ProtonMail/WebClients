import React, { useEffect, useState, useCallback } from 'react';
import {
    DropdownActions,
    ConfirmModal,
    Alert,
    useContactGroups,
    useContactEmails,
    useNotifications,
    useModals,
    useApi,
    useEventManager,
    OrderableTable,
    OrderableTableHeader,
    OrderableTableBody,
    OrderableTableRow
} from 'react-components';
import { c, msgid } from 'ttag';
import { deleteLabel, orderContactGroup } from 'proton-shared/lib/api/labels';
import { move } from 'proton-shared/lib/helpers/array';

import ContactGroupModal from './ContactGroupModal';
import ContactGroupIcon from './ContactGroupIcon';

const ContactGroupsTable = () => {
    const [contactGroups] = useContactGroups();
    const [contactEmails] = useContactEmails();
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const api = useApi();
    const { call } = useEventManager();

    const [list = [], setContactGroups] = useState(contactGroups);

    useEffect(() => {
        setContactGroups(contactGroups);
    }, [contactGroups]);

    const handleConfirmDeletion = (ID) => async () => {
        await api(deleteLabel(ID));
        await call();
        createNotification({
            text: c('Contact group notification').t`Contact group removed`
        });
    };

    const handleSortEnd = useCallback(
        async ({ oldIndex, newIndex }) => {
            try {
                const newList = move(list, oldIndex, newIndex);
                setContactGroups(newList);
                await api(orderContactGroup({ LabelIDs: newList.map(({ ID }) => ID) }));
                call();
            } catch (error) {
                setContactGroups(contactGroups);
            }
        },
        [list, contactGroups]
    );

    const header = [c('Table header').t`Name`, c('Table header').t`Group size`, c('Table header').t`Actions`];

    return (
        <OrderableTable className="noborder" onSortEnd={handleSortEnd}>
            <OrderableTableHeader cells={header} />
            <OrderableTableBody>
                {list.map(({ ID, Name, Color }, index) => {
                    const countEmailAddresses = (contactEmails || []).filter(({ LabelIDs = [] }) =>
                        LabelIDs.includes(ID)
                    ).length;
                    const list = [
                        {
                            text: c('Action').t`Edit`,
                            onClick() {
                                createModal(<ContactGroupModal contactGroupID={ID} />);
                            }
                        },
                        {
                            text: c('Action').t`Delete`,
                            onClick() {
                                createModal(
                                    <ConfirmModal
                                        onConfirm={handleConfirmDeletion(ID)}
                                        title={c('Title').t`Delete contact group`}
                                    >
                                        <Alert type="warning">
                                            <p>{c('Info').t`Are you sure you want to delete this contact group?`}</p>
                                            <p>{c('Info')
                                                .t`Contacts in the group aren't deleted if the contact group is deleted.`}</p>
                                        </Alert>
                                    </ConfirmModal>
                                );
                            }
                        }
                    ];
                    const cells = [
                        <div key={ID} className="flex">
                            <span className="ellipsis">
                                <ContactGroupIcon name={Name} color={Color} /> {Name}
                            </span>
                        </div>,
                        c('Info').ngettext(
                            msgid`${countEmailAddresses} email address`,
                            `${countEmailAddresses} email addresses`,
                            countEmailAddresses
                        ),
                        <DropdownActions key={ID} className="pm-button--small" list={list} />
                    ];
                    return <OrderableTableRow key={ID} index={index} cells={cells} />;
                })}
            </OrderableTableBody>
        </OrderableTable>
    );
};

export default ContactGroupsTable;
