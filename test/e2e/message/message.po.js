module.exports = (type = 'column') => {

    const SELECTOR = {
        container: {
            row: '#conversation-list-rows',
            column: '#conversation-list-columns'
        },
        conversation: '.conversation',
        message: {
            container: '#conversation-view',
            title: '#conversationHeader > h1',
            subcontainer: '#pm_thread',
            item: '.message',
            body: '.bodyDecrypted',
            details: '.recipients-details',
            displayButtons: {
                remote: '.displayContentBtn-container[data-action="remote"]',
                embedded: '.displayContentBtn-container[data-action="embedded"]'
            },
            button: {
                toggleDetails: '.toggleDetails',
                composeToFrom: '.message-contact-sender',
                composeToTo: '.messageContacts-btn-compose',
                reply: '.message-actionBtn-reply',
                replyall: '.message-actionBtn-replyall',
                forward: '.message-actionBtn-forward',
                blockquote: '.proton-message-blockquote-toggle'
            }
        }
    };

    const SCOPE = `$('${SELECTOR.container[type]}')`;

    const open = (index = 0) => {
        return browser.executeScript(`
            return ${SCOPE}
                .find('${SELECTOR.conversation}')
                .eq(${index})
                .click();
        `);
    };

    const isOpened = () => {
        return browser.executeScript(`
            return $('${SELECTOR.message.container}').is(':visible');
        `);
    };

    const conversation = () => {

        const SCOPE = `$('${SELECTOR.message.container}')`;

        const isVisible = () => {
            return browser.executeScript(`
                return ${SCOPE}.is(':visible');
            `);
        };

        const count = () => {
            return browser.executeScript(`
                return ${SCOPE}
                    .find('${SELECTOR.message.item}')
                    .length
            `);
        };

        const getTitle = () => {
            return browser.executeScript(`
                const $title = $('${SELECTOR.message.title}');
                return {
                    title: $title.find('span:last-of-type').text(),
                    number: $title.find('span:first-of-type').text().split('').filter((i) => !isNaN(+i)).join(''),
                    full: $title.text()
                };
            `);
        };

        const isDetailsVisibleLatest = () => {
            // the last one should be visiblee
            return browser.executeScript(`
                const lastVisible = ${SCOPE}
                    .find('${SELECTOR.message.item}:not(.draft):last')
                    .find('${SELECTOR.message.details}')
                    .is(':visible');

                const hasOne = ${SCOPE}
                    .find('${SELECTOR.message.details}').length === 1;

                return lastVisible && hasOne;
            `);
        };

        const isBodyVisibleForLatest = () => {
            // the last one should be visiblee
            return browser.executeScript(`
                const lastVisible = ${SCOPE}
                    .find('${SELECTOR.message.item}:not(.draft):last')
                    .find('${SELECTOR.message.body}')
                    .is(':visible');

                const hasOne = ${SCOPE}
                    .find('${SELECTOR.message.body}').length === 1;

                return lastVisible && hasOne;
            `);
        };


        return { isVisible, count, getTitle, isDetailsVisibleLatest, isBodyVisibleForLatest };
    };

    const message = (index = 0) => {
        const SCOPE = `$('${SELECTOR.message.container}').find('${SELECTOR.message.item}').eq(${index})`;

        const isOpened = () => {
            return browser.executeScript(`
                return ${SCOPE}
                    .find('${SELECTOR.message.body}')
                    .is(':visible');
            `);
        };

        const open = () => {
            return browser.executeScript(`
                return ${SCOPE}
                    .find('.summary')
                    .triggerHandler('mouseup');
            `);
        };

        const isDetailsVisible = () => {
            return browser.executeScript(`
                return ${SCOPE}
                    .find('${SELECTOR.message.details}')
                    .is(':visible');
            `);
        };

        const toggleDetails = () => {
            return browser.executeScript(`
                return ${SCOPE}
                    .find('${SELECTOR.message.button.toggleDetails}')
                    .click();
            `);
        };

        const reply = (type = 'reply') => {
            return browser.executeScript(`
                return ${SCOPE}
                    .find('${SELECTOR.message.button[type]}')
                    .get(0)
                    .click();
            `);
        };

        const composeTo = (type = 'from') => {
            const selector = (type === 'from') ? 'composeToFrom' : 'composeToTo';
            return browser.executeScript(`
                return ${SCOPE}
                    .find('${SELECTOR.message.button[selector]}')
                    .get(0)
                    .click();
            `);
        };

        const loadContent = (type) => {
            const selector = `${SCOPE}.find('${SELECTOR.message.displayButtons[type]}')`;

            const isVisible = () => {
                return browser.executeScript(`
                    return ${selector}.is(':visible');
                `);
            };

            const click = () => {
                return browser.executeScript(`
                    return ${selector}.click();
                `);
            };

            const hasLoaded = () => {
                const selector = `${SCOPE}.find('${SELECTOR.message.body}')`;
                if (type === 'embedded') {
                    return browser.executeScript(`
                        const img = ${selector}[0]
                            .querySelector('img[proton-src^="cid:"]');
                        return (img && /blob:http/.test(img.src));
                    `);
                }


                return browser.executeScript(`
                    const img = ${selector}[0]
                        .querySelector('img[proton-src^="http"]');
                    return (img && img.src === img.getAttribute('proton-src'));
                `);
            };

            return { isVisible, click, hasLoaded };
        };

        return { isOpened, open, isDetailsVisible, toggleDetails, reply, composeTo, loadContent };
    };

    return { open, isOpened, conversation, message };

};
