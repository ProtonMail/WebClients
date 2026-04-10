//
// CredentialIdentity.swift
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

public enum CredentialIdentity: Sendable {
    case password(PasswordCredentialIdentity)
    case passkey(PasskeyCredentialIdentity)
    case oneTimeCode(OneTimeCodeCredentialIdentity)
}

/// For each type of credential identity supported by Apple,
/// we create a proxy object to not expose these types to the outside world
public struct PasswordCredentialIdentity: Sendable {
    public let id: String
    public let username: String
    public let url: String
    public let lastUseTime: Int

    public init(id: String, username: String, url: String, lastUseTime: Int) {
        self.id = id
        self.username = username
        self.url = url
        self.lastUseTime = lastUseTime
    }

    func toASPasswordCredentialIdentity() -> ASPasswordCredentialIdentity {
        let identifier = ASCredentialServiceIdentifier(identifier: url, type: .URL)
        let identity = ASPasswordCredentialIdentity(serviceIdentifier: identifier,
                                                    user: username,
                                                    recordIdentifier: id)
        identity.rank = lastUseTime
        return identity
    }
}

public struct PasskeyCredentialIdentity: Sendable {
    public let id: String
    public let relyingPartyIdentifier: String
    public let userName: String
    public let userHandle: Data
    public let credentialId: Data

    public init(id: String,
                relyingPartyIdentifier: String,
                userName: String,
                userHandle: Data,
                credentialId: Data) {
        self.id = id
        self.relyingPartyIdentifier = relyingPartyIdentifier
        self.userName = userName
        self.userHandle = userHandle
        self.credentialId = credentialId
    }

    func toASPasskeyCredentialIdentity() -> ASPasskeyCredentialIdentity {
        ASPasskeyCredentialIdentity(relyingPartyIdentifier: relyingPartyIdentifier,
                                    userName: userName,
                                    credentialID: credentialId,
                                    userHandle: userHandle,
                                    recordIdentifier: id)
    }
}

public struct OneTimeCodeCredentialIdentity: Sendable {
    public let id: String
    public let username: String
    public let url: String
    public let lastUseTime: Int

    public init(id: String, username: String, url: String, lastUseTime: Int) {
        self.id = id
        self.username = username
        self.url = url
        self.lastUseTime = lastUseTime
    }

    @available(iOS 18.0, macOS 15.0, *)
    func toASOneTimeCodeCredentialIdentity() -> ASOneTimeCodeCredentialIdentity {
        let identifier = ASCredentialServiceIdentifier(identifier: url, type: .URL)
        let identity = ASOneTimeCodeCredentialIdentity(serviceIdentifier: identifier,
                                                       label: username,
                                                       recordIdentifier: id)
        identity.rank = lastUseTime
        return identity
    }
}
