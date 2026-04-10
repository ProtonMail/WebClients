//
// AutoFillCoordinator+SetUpStart.swift
// Proton Pass - Created on 25/09/2025.
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

/// Handle `ASCredentialProviderViewController`'s callback
public extension AutoFillCoordinator {
    func prepareCredentialList(for serviceIdentifiers: [ASCredentialServiceIdentifier]) {
        setUpAndStart(mode: .showAllLogins(serviceIdentifiers, nil))
    }

    func prepareCredentialList(for serviceIdentifiers: [ASCredentialServiceIdentifier],
                               requestParameters: ASPasskeyCredentialRequestParameters) {
        setUpAndStart(mode: .showAllLogins(serviceIdentifiers, requestParameters))
    }

    func prepareInterfaceForExtensionConfiguration() {
        setUpAndStart(mode: .configuration)
    }

    func prepareOneTimeCodeCredentialList(for serviceIdentifiers: [ASCredentialServiceIdentifier]) {
        setUpAndStart(mode: .showOneTimeCodes(serviceIdentifiers))
    }

    func prepareInterfaceForUserChoosingTextToInsert() {
        setUpAndStart(mode: .textInsertion)
    }

    func provideCredentialWithoutUserInteraction(for credentialRequest: any ASCredentialRequest) {
        setUpAndStart(mode: .autoFill(credentialRequest))
    }

    func prepareInterfaceToProvideCredential(for credentialRequest: any ASCredentialRequest) {
        setUpAndStart(mode: .autoFill(credentialRequest))
    }

    func prepareInterface(forPasskeyRegistration registrationRequest: any ASCredentialRequest) {
        setUpAndStart(mode: .passkeyRegistration(registrationRequest))
    }
}
