import _ from 'lodash';
import { isExpiredKey } from 'pmcrypto';

import { PACKAGE_TYPE } from '../../constants';
import { toList } from '../../../helpers/arrayHelper';
import { uniqGroups } from '../../../helpers/vcard';
import { extractAll as extractAllProperties } from '../../../helpers/vCardProperties';

/* @ngInject */
function contactImportEncryption($injector, contactKey, contactAskEncryptionModal, contactKeyAssigner) {
    const asyncSequentialMap = (list, asyncFunction) =>
        list.reduce((lastProcess, element) => {
            return lastProcess.then((accumulator) => {
                return asyncFunction(element).then((result) => accumulator.concat([result]));
            });
        }, Promise.resolve([]));

    const encryptModal = (email) =>
        new Promise((resolve) =>
            contactAskEncryptionModal.activate({
                params: {
                    email,
                    submit(result) {
                        resolve(result);
                        contactAskEncryptionModal.deactivate();
                    },
                    onEscape: _.noop
                }
            })
        );

    const groupGenerator = (contact) => {
        const properties = extractAllProperties(contact.vCard);
        const groups = uniqGroups(properties);

        let itemCounter = 0;
        const generate = () => {
            itemCounter++;
            const groupName = `item${itemCounter}`;
            if (groups.includes(groupName)) {
                return generate();
            }
            groups.push(groupName);
            return groupName;
        };
        return generate;
    };

    const normalize = (contact) => {
        const generateGroup = groupGenerator(contact);
        const emailList = toList(contact.vCard.get('email'));

        emailList.forEach((emailProp) => (emailProp.group = emailProp.group || generateGroup()));

        contact.vCard.remove('email');
        emailList.forEach((prop) => contact.vCard.addProperty(prop));

        return contactKeyAssigner.reassign(contact.vCard);
    };

    /**
     * Pre process the contacts and ask the user if he wants to enable encryption if possible
     * @param contacts
     */
    const process = (contacts) => {
        let allDecision = null;
        const sendPreferences = $injector.get('sendPreferences');
        const askUserForEncryption = async (email) => {
            if (allDecision !== null) {
                return allDecision;
            }
            const { applyToAll, encrypt } = await encryptModal(email);
            if (applyToAll) {
                allDecision = encrypt;
            }
            return encrypt;
        };

        /**
         * Process the contact by normalizing all groups of emails and potentially asking the user to enable encryption
         * if keys are available
         * @param contact
         */
        const processContact = (contact) =>
            normalize(contact).then(() => {
                const emailList = toList(contact.vCard.get('email'));
                const keyList = toList(contact.vCard.get('key'));
                const encryptList = toList(contact.vCard.get('x-pm-encrypt'));
                return asyncSequentialMap(emailList, async (emailProp) => {
                    // first do filtering that does not require the API
                    const group = emailProp.getGroup();
                    const encrypts = encryptList.filter((prop) => prop.getGroup() === group);
                    // short circuit as soon as we know we should not ask the user to enable encryption.
                    if (encrypts.length > 0) {
                        return;
                    }
                    const keys = keyList.filter((prop) => prop.getGroup() === group);
                    if (keys.length === 0) {
                        return;
                    }
                    const parsedKeys = await Promise.all(keys.map(contactKey.parseKey));
                    const keyObjects = await Promise.all(
                        parsedKeys
                            .filter((k) => k)
                            .map(([k = false]) => k)
                            .map((k) => {
                                if (!k) {
                                    return Promise.resolve(k);
                                }
                                return isExpiredKey(k).then((isExpired) => (isExpired ? false : k));
                            })
                    );

                    if (!keyObjects.some((k) => k)) {
                        return;
                    }

                    const info = await sendPreferences.get([emailProp.valueOf()]);
                    if (info.scheme === PACKAGE_TYPE.SEND_PM) {
                        // internal user: skip
                        return;
                    }

                    // a key is set but no matching encrypt flag
                    const encrypt = await askUserForEncryption(emailProp.valueOf());
                    if (encrypt) {
                        contact.vCard.set('x-pm-encrypt', 'true', { group });
                        contact.vCard.set('x-pm-sign', 'true', { group });
                    }
                }).then(() => contact);
            });

        return asyncSequentialMap(contacts, processContact);
    };
    return { process };
}
export default contactImportEncryption;
