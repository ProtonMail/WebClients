// const ContactPage = require('./contact.po');
// const EC = protractor.ExpectedConditions;

// describe('Contact tests', () => {
//   const contactPage = ContactPage();

//   beforeEach(() => {
//     contactPage.navigate();
//   });

//   it('should go to contacts', () => {
//     expect(browser.getCurrentUrl()).toContain('/contacts');
//   });

//   it('should add a contact', (done) => {
//       contactPage
//         .getContactList()
//         .then((items) => {
//           const total = items.length;

//           contactPage
//             .add(browser.params.contact.create)
//             .then(() => {

//               contactPage
//                 .getContactList()
//                 .then((items) => {
//                   expect(items.length).toEqual(total + 1);
//                   done()
//                 });
//             });
//         });
//   });

//   it('should remove the last contact', (done) => {
//     contactPage
//       .add({
//         name: 'bob',
//         email: 'bob@protonmail.com'
//       })
//       .then(() => {
//         contactPage
//           .getContactList()
//           .then((items) => {

//             const total = items.length;

//             contactPage
//               .remove(items)
//               .then(() => {
//                 expect(contactPage.getModalMessage()).toEqual('Are you sure you want to delete this contact?');

//                 const { confirm } = contactPage.getModalButtons();
//                 confirm.click();

//                 contactPage
//                   .getContactList()
//                   .then((items) => {
//                     expect(items.length).toEqual(total);
//                     done();
//                   });
//               });
//           });
//       })


//   });


//   it('should remove all contacts', () => {
//     contactPage
//       .add({
//         name: 'bob',
//         email: 'bob@protonmail.com'
//       });

//     contactPage
//       .removeAll()
//       .then(() => {

//         browser.sleep(1000);

//         expect(contactPage.getModalMessage()).toEqual('Are you sure you want to delete all your contacts?');

//         const { confirm } = contactPage.getModalButtons();
//         confirm.click();

//         const notification = contactPage.getNotification();
//         browser.wait(EC.visibilityOf(notification), 5000);

//         // expect(notification.getText()).toEqual('Contacts deleted');
//         expect(contactPage.getContactList(true).isPresent()).toBe(false);
//         expect(contactPage.getAlert().getText()).toEqual('You have no contacts, you can add contact with the above button ‘ADD CONTACT’.');
//       });

//   });

//   // it('should have 0 contacts', function() {
//   //     // TODO determine if all deleted by notification modal, not counting number of contacts
//   //     browser.sleep(4000);
//   //     expect(contactPage.contactList.count()).toEqual(0);
//   //     // var noti = element(by.css('.cg-notify-message-template'));
//   //     // browser.wait(EC.visibilityOf(noti), 5000);
//   //     // noti.getText().then(function(text){console.log(text);});
//   //     expect(contactPage.numContacts().then(function(num) {
//   //         return num;
//   //     }))
//   //         .toEqual(0);
//   // });



//   // it('should have the correct name and email', function() {
//   //     expect(contactPage.getContact(0).then(function(contact) {
//   //         return contact.name + ' ' + contact.email;
//   //     }))
//   //         .toEqual(browser.params.contactName + ' ' + browser.params.contactEmail);
//   // });

//   // it('should edit the contact', function() {
//   //     contactPage.edit(browser.params.editedName,browser.params.editedEmail);
//   // });

//   // it('should have the edited name and email', function() {
//   //     expect(contactPage.getContact(0).then(function(contact) {
//   //         return contact.name + ' ' + contact.email;
//   //     }))
//   //         .toEqual(browser.params.editedName + ' ' + browser.params.editedEmail);
//   // });

//   // it('should compose a message to the contact', function() {
//   //     contactPage.compose();
//   //     expect(contactPage.recipient.getText()).toEqual('To: ' + browser.params.editedName);
//   //     contactPage.discardMessage();
//   // });

//   // it('should fail to add a duplicate contact', function() {
//   //     contactPage.add(browser.params.editedName, browser.params.editedEmail);
//   //     browser.sleep(2000);
//   //     expect(contactPage.contactList.count()).toEqual(1);
//   // });

//   // it('should add a second contact', function() {
//   //     contactPage.add(browser.params.contactName, browser.params.contactEmail);
//   //     browser.sleep(2000);
//   //     expect(contactPage.contactList.count()).toEqual(2);
//   // });

//   // it('should fail to edit the contact to duplicate email', function() {
//   //     contactPage.edit(browser.params.editedName,browser.params.editedEmail);
//   //     // TODO Check for failed change once fix is made
//   // });

//   // it('should delete the first contact', function() {
//   //     contactPage.delete();
//   //     browser.sleep(2000);
//   //     expect(contactPage.contactList.count()).toEqual(1);
//   // });
// });
