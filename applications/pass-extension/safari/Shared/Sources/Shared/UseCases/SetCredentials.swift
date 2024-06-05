//
// SetCredentials.swift
// Proton Pass - Created on 20/05/2024.
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

public protocol SetCredentialsUseCase: Sendable {
    func execute(_ credentials: Credentials?) async throws
}

public extension SetCredentialsUseCase {
    func callAsFunction(_ credentials: Credentials?) async throws {
        try await execute(credentials)
    }
}

public final class SetCredentials: Sendable, SetCredentialsUseCase {
    private let keychain: any KeychainProvider

    public init(keychain: any KeychainProvider) {
        self.keychain = keychain
    }

    public func execute(_ credentials: Credentials?) async throws {
        let key = Constants.credentialsKey
        if let credentials {
            let data = try JSONEncoder().encode(credentials)
            try await keychain.setData(data, for: key)
        } else {
            try await keychain.setData(nil, for: key)
        }
    }
}
