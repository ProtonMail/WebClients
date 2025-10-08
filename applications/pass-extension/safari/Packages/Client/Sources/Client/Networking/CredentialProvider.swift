//
// CredentialProvider.swift
// Proton Pass - Created on 21/05/2024.
// Copyright (c) 2024 Proton Technologies AG
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
//

import Foundation
import Models
@preconcurrency import ProtonCoreNetworking

public protocol CredentialProvider: Sendable {
    func getCredentials() -> Credentials?
    func setCredential(_ credential: Credentials?)
}

public extension CredentialProvider {
    func getAuthCredential() -> AuthCredential? {
        getCredentials()?.toCoreCredentials
    }

    func setAuthCredential(_ credential: AuthCredential?) {
        let credentials: Credentials? = if let credential {
            Credentials(sessionID: credential.sessionID,
                        accessToken: credential.accessToken,
                        refreshToken: credential.refreshToken,
                        userID: credential.userID)
        } else {
            nil
        }
        setCredential(credentials)
    }
}

public final class CredentialProviderImpl: CredentialProvider {
    private let keychain: any KeychainProvider
    private let keychainKey = Constants.credentialsKey
    private nonisolated(unsafe) var credentials: Credentials?

    public init(keychain: any KeychainProvider) {
        self.keychain = keychain
        let semaphore = DispatchSemaphore(value: 0)
        Task { [weak self] in
            guard let self else { return }
            credentials = try? await get()
            semaphore.signal()
        }
        semaphore.wait()
    }

    public func getCredentials() -> Credentials? {
        credentials
    }

    public func setCredential(_ credentials: Credentials?) {
        Task { [weak self] in
            guard let self else { return }
            if let credentials {
                let data = try JSONEncoder().encode(credentials)
                try await keychain.setData(data, for: keychainKey)
            } else {
                try await keychain.setData(nil, for: keychainKey)
            }
        }
    }
}

private extension CredentialProviderImpl {
    func get() async throws -> Credentials? {
        guard let data = try await keychain.getData(for: keychainKey) else {
            return nil
        }
        return try JSONDecoder().decode(Credentials.self, from: data)
    }
}

private extension Credentials {
    var toCoreCredentials: AuthCredential {
        .init(sessionID: sessionID,
              accessToken: accessToken,
              refreshToken: refreshToken,
              userName: "",
              userID: userID,
              privateKey: nil,
              passwordKeySalt: nil)
    }
}
