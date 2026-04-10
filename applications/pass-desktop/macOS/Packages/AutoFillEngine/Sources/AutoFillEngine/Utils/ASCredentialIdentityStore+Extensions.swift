//
// ASCredentialIdentityStore+Extensions.swift
// Proton Pass - Created on 23/09/2025.
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

extension ASCredentialIdentityStore {
    enum Action {
        case save, replace, remove
    }

    func perform(_ action: Action, on credentials: [CredentialIdentity]) async throws {
        let domainCredentials: [any ASCredentialIdentity] = credentials.compactMap { cred in
            switch cred {
            case let .password(identity):
                identity.toASPasswordCredentialIdentity()

            case let .passkey(identity):
                identity.toASPasskeyCredentialIdentity()

            case let .oneTimeCode(identity):
                if #available(iOS 18.0, macCatalyst 18.0, macOS 15.0, *) {
                    identity.toASOneTimeCodeCredentialIdentity()
                } else {
                    nil
                }
            }
        }

        switch action {
        case .save:
            try await saveCredentialIdentities(domainCredentials)

        case .replace:
            try await replaceCredentialIdentities(domainCredentials)

        case .remove:
            try await removeCredentialIdentities(domainCredentials)
        }
    }
}
