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
import ProtonCoreNetworking

public protocol CredentialProvider {
    func getCredential() -> AuthCredential?
    func setCredential(_ credential: AuthCredential?)
}

public final class CredentialProviderImpl: CredentialProvider {
    private let setCredentials: any SetCredentialsUseCase
    private var credentials: Credentials?

    public init(getCredentials: any GetCredentialsUseCase,
                setCredentials: any SetCredentialsUseCase) {
        self.setCredentials = setCredentials
        let semaphore = DispatchSemaphore(value: 0)
        Task {
            credentials = try? await getCredentials()
            semaphore.signal()
        }
        semaphore.wait()
    }

    public func getCredential() -> AuthCredential? {
        credentials?.toCoreCredentials
    }

    public func setCredential(_ credential: AuthCredential?) {
        Task {
            if let credential {
                try? await setCredentials(.init(sessionID: credential.sessionID,
                                                accessToken: credential.accessToken,
                                                refreshToken: credential.refreshToken,
                                                userID: credential.userID))
            } else {
                try? await setCredentials(nil)
            }
        }
    }
}

extension Credentials {
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
