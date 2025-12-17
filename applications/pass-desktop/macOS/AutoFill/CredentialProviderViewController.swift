//
// CredentialProviderViewController.swift
// Proton Pass - Created on 05/12/2025.
// Copyright (c) 2025 Proton Technologies AG
//
// This file is part of Proton Pass.
//
// Proton Pass is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Proton Pass is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Proton Pass. If not, see https://www.gnu.org/licenses/.

import AuthenticationServices

class CredentialProviderViewController: ASCredentialProviderViewController {

    /*
     Prepare your UI to list available credentials for the user to choose from. The items in
     'serviceIdentifiers' describe the service the user is logging in to, so your extension can
     prioritize the most relevant credentials in the list.
    */
    override func prepareCredentialList(for serviceIdentifiers: [ASCredentialServiceIdentifier]) {
    }

    /*
     Implement this method if your extension supports showing credentials in the QuickType bar.
     When the user selects a credential from your app, this method will be called with the
     ASPasswordCredentialIdentity your app has previously saved to the ASCredentialIdentityStore.
     Provide the password by completing the extension request with the associated ASPasswordCredential.
     If using the credential would require showing custom UI for authenticating the user, cancel
     the request with error code ASExtensionError.userInteractionRequired.

    override func provideCredentialWithoutUserInteraction(for credentialIdentity: ASPasswordCredentialIdentity) {
        let databaseIsUnlocked = true
        if (databaseIsUnlocked) {
            let passwordCredential = ASPasswordCredential(user: "j_appleseed", password: "apple1234")
            self.extensionContext.completeRequest(withSelectedCredential: passwordCredential, completionHandler: nil)
        } else {
            self.extensionContext.cancelRequest(withError: NSError(domain: ASExtensionErrorDomain, code:ASExtensionError.userInteractionRequired.rawValue))
        }
    }
    */

    /*
     Implement this method if provideCredentialWithoutUserInteraction(for:) can fail with
     ASExtensionError.userInteractionRequired. In this case, the system may present your extension's
     UI and call this method. Show appropriate UI for authenticating the user then provide the password
     by completing the extension request with the associated ASPasswordCredential.

    override func prepareInterfaceToProvideCredential(for credentialIdentity: ASPasswordCredentialIdentity) {
    }
    */

    @IBAction func cancel(_ sender: AnyObject?) {
        self.extensionContext.cancelRequest(withError: NSError(domain: ASExtensionErrorDomain, code: ASExtensionError.userCanceled.rawValue))
    }

    @IBAction func passwordSelected(_ sender: AnyObject?) {
        let passwordCredential = ASPasswordCredential(user: "j_appleseed", password: "apple1234")
        self.extensionContext.completeRequest(withSelectedCredential: passwordCredential, completionHandler: nil)
    }

}
