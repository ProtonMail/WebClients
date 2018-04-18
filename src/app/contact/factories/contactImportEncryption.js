import _ from 'lodash';

import { toList } from '../../../helpers/arrayHelper';
import { uniqGroups } from '../../../helpers/vcard';
import { PACKAGE_TYPE } from '../../constants';

/* @ngInject */
function contactImportEncryption(pmcw, $injector, contactKey, contactAskEncryption, contactKeyAssigner, vcard) {
    const asyncSequentialMap = (list, asyncFunction) =>
        list.reduce((lastProcess, element) => {
            return lastProcess.then((accumulator) => {
                return asyncFunction(element).then((result) => accumulator.concat([result]));
            });
        }, Promise.resolve([]));

    const encryptModal = (email) =>
        new Promise((resolve) =>
            contactAskEncryption.activate({
                params: {
                    email,
                    submit(result) {
                        resolve(result);
                        contactAskEncryption.deactivate();
                    },
                    onEscape: _.noop
                }
            })
        );

    const groupGenerator = (contact) => {
        const properties = vcard.extractProperties(contact.vCard);
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

        const processContact = (contact) =>
            normalize(contact).then(() => {
                const emailList = toList(contact.vCard.get('email'));
                const keyList = toList(contact.vCard.get('key'));
                const encryptList = toList(contact.vCard.get('x-pm-encrypt'));
                return asyncSequentialMap(emailList, async (emailProp) => {
                    const sendPreferences = $injector.get('sendPreferences');
                    const info = await sendPreferences.get(emailProp.valueOf());
                    if (info.scheme === PACKAGE_TYPE.SEND_PM) {
                        // internal user: skip
                        return;
                    }

                    const group = emailProp.getGroup();
                    const encrypts = encryptList.filter((prop) => prop.getGroup() === group);
                    const keys = keyList.filter((prop) => prop.getGroup() === group);
                    const keyObjects = await Promise.all(
                        keys
                            .map(contactKey.parseKey)
                            .filter((k) => k)
                            .map(([k = false]) => k)
                            .map((k) => {
                                if (!k) {
                                    return Promise.resolve(k);
                                }
                                return pmcw.isExpiredKey(k).then((isExpired) => (isExpired ? false : k));
                            })
                    );

                    if (keyObjects.filter((k) => k).length === 0 || encrypts.length > 0) {
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
