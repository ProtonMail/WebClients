//
// ASCredentialProviderExtensionContext+Extensions.swift
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

public enum CredentialProviderRequest {
    case autoFill(any ASAuthorizationCredential)
    case textInsertion(String)
}

public extension ASCredentialProviderExtensionContext {
    /// Different iOS/macOS versions support different types of autofilling,
    /// we wrap them up to provide a more concise API with no need to check for availability
    func perform(request: CredentialProviderRequest) async {
        switch request {
        case let .autoFill(credential):
            if let passwordCredential = credential as? ASPasswordCredential {
                completeRequest(withSelectedCredential: passwordCredential)
            } else if let passkeyCredential = credential as? ASPasskeyAssertionCredential {
                await completeAssertionRequest(using: passkeyCredential)
            } else if #available(iOS 18.0, macCatalyst 18.0, macOS 15.0, *),
                      let oneTimeCodeCredential = credential as? ASOneTimeCodeCredential {
                await completeOneTimeCodeRequest(using: oneTimeCodeCredential)
            }

        case let .textInsertion(text):
            #if targetEnvironment(iOS)
            if #available(iOS 18.0, *) {
                await completeRequest(withTextToInsert: text)
            }
            #endif
        }
        assertionFailure("Unknown CredentialProviderRequest")
    }

    func cancel(reason: ASExtensionError.Code) {
        let error = NSError(domain: ASExtensionErrorDomain, code: reason.rawValue)
        cancelRequest(withError: error)
    }
}
