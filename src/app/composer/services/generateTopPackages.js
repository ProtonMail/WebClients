import _ from 'lodash';

import htmlToTextMail from '../../squire/helpers/htmlToTextMail';
import { SEND_TYPES } from '../../constants';

/* @ngInject */
function generateTopPackages(editorModel, AttachmentLoader, mimeMessageBuilder) {
    /**
     * Removes any characters that are produced by the copying process (like zero width characters)
     * See: http://www.berklix.org/help/majordomo/#quoted we want to avoid sending unnecessary quoted printable encodings
     */
    const filterCharacters = (string) => string.replace(/\u200B/g, '');

    const generatePlaintext = (message, { editor }) => {
        if (message.MIMEType !== 'text/html') {
            return filterCharacters(message.getDecryptedBody());
        }
        return filterCharacters(htmlToTextMail(editor, true));
    };

    // We NEVER upconvert, if the user wants html: plaintext is actually fine as well
    const generateHTML = (message) => (message.MIMEType === 'text/html' ? message.getDecryptedBody() : false);

    const generatePlainTextPackage = async (message, composer) => {
        return {
            Type: 0,
            Addresses: {},
            MIMEType: 'text/plain',
            Body: generatePlaintext(message, composer)
        };
    };

    const generateHTMLPackage = async (message) => {
        return {
            Type: 0,
            Addresses: {},
            MIMEType: 'text/html',
            Body: generateHTML(message)
        };
    };

    const fetchMimeDependencies = (message, composer) =>
        Promise.all([
            Promise.all(
                _.map(message.getAttachments(), async (attachment) => ({
                    attachment,
                    data: await AttachmentLoader.get(attachment, message)
                }))
            ),
            generatePlaintext(message, composer)
        ]);

    /**
     * Generates the mime top-level packages, which include all attachments in the body.
     * @param message
     * @param composer
     * @returns {Promise.<{Type: number, Addresses: {}, MIMEType: string, Body}>}
     */
    const generateMimePackage = async (message, composer) => {
        // Build the multipart/alternate MIME entity containing both the HTML and plain text entities.

        const [attachments, plaintext] = await fetchMimeDependencies(message, composer);
        const html = generateHTML(message);

        return {
            Type: 0,
            Addresses: {},
            MIMEType: 'multipart/mixed',
            Body: mimeMessageBuilder.build(plaintext, html, attachments)
        };
    };

    /**
     * Generates all top level packages. The top level packages have unencrypted bodies which are encrypted later on
     * once the sub level packages are attached, so we know with which keys we need to encrypt the bodies with.
     * Top level packages that are not needed are not generated.
     * @param message
     * @param sendPref
     * @returns {Promise.<{}>}
     */
    const generateTopPackages = async (message, sendPref) => {
        const composer = editorModel.find(message);
        const packagesStatus = _.reduce(
            sendPref,
            (packages, info) => ({
                plaintext: packages.plaintext || info.mimetype === 'text/plain',
                html:
                    packages.html ||
                    info.mimetype === 'text/html' ||
                    (info.scheme === SEND_TYPES.SEND_PGP_MIME && !info.encrypt && !info.sign),
                mime: packages.mime || (info.scheme === SEND_TYPES.SEND_PGP_MIME && (info.encrypt || info.sign))
            }),
            {
                plaintext: false,
                html: false,
                mime: false
            }
        );

        const demandedPackages = _.filter(_.keys(packagesStatus), (k) => packagesStatus[k]);
        const packages = {};

        await Promise.all(
            demandedPackages.map((type) => {
                switch (type) {
                    case 'mime':
                        return generateMimePackage(message, composer).then((pack) => (packages.mime = pack));
                    case 'plaintext':
                        return generatePlainTextPackage(message, composer).then((pack) => (packages.plaintext = pack));
                    case 'html':
                        return generateHTMLPackage(message).then((pack) => (packages.html = pack));
                    default:
                        // Should never happen.
                        return Promise.reject();
                }
            })
        );

        return packages;
    };

    return generateTopPackages;
}
export default generateTopPackages;
