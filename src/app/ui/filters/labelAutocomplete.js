import { EMAIL_FORMATING } from '../../constants';

const { OPEN_TAG_AUTOCOMPLETE_RAW, CLOSE_TAG_AUTOCOMPLETE_RAW } = EMAIL_FORMATING;

/* @ngInject */
function labelAutocomplete(contactGroupModel, composerContactGroupSelection) {
    /**
     * Show total of members inside a contact group or the ratio of
     * <selected>/<total>
     * @param  {String} ID        ID of the contact group
     * @param  {String} MessageID
     * @return {String}
     */
    const getTotalMember = (ID, MessageID) => {
        const model = composerContactGroupSelection(MessageID);
        const selection = (model.get(ID) || []).length;

        if (selection && selection !== contactGroupModel.getNumber(ID)) {
            return `${selection}/${contactGroupModel.getNumberString(ID)}`;
        }
        return `${contactGroupModel.getNumber(ID)}/${contactGroupModel.getNumberString(ID)}`;
    };

    /**
     * Format the email or the group to have a nice UI
     * @param  {String} options.Name           Name of the email
     * @param  {String} options.Address        Address or ID of the contact group
     * @param  {Boolean} options.isContactGroup
     * @param  {String} options.ID             Message's ID
     * @return {String}
     */
    return ({ Name = '', Address = '', isContactGroup } = {}, { ID } = {}, keyList) => {
        if (isContactGroup) {
            return `${Name} (${getTotalMember(Address, ID, keyList)})`;
        }

        if (Name === Address) {
            return Address;
        }

        return `${Name} ${OPEN_TAG_AUTOCOMPLETE_RAW}${Address}${CLOSE_TAG_AUTOCOMPLETE_RAW}`;
    };
}
export default labelAutocomplete;
