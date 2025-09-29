//
// ResetDataIfFirstRun.swift
// Proton Pass - Created on 23/05/2024.
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

import Client
import Foundation

private let kIsFirstRun = "IsFirstRun"

public protocol ResetDataIfFirstRunUseCase: Sendable {
    func execute() async throws
}

public extension ResetDataIfFirstRunUseCase {
    func callAsFunction() async throws {
        try await execute()
    }
}

public final class ResetDataIfFirstRun: Sendable, ResetDataIfFirstRunUseCase {
    private let userDefaults: UserDefaults
    private let setEnvironment: any SetEnvironmentUseCase
    private let credentialProvider: any CredentialProvider

    public init(userDefaults: UserDefaults = .standard,
                setEnvironment: any SetEnvironmentUseCase,
                credentialProvider: any CredentialProvider) {
        self.userDefaults = userDefaults
        self.setEnvironment = setEnvironment
        self.credentialProvider = credentialProvider
    }

    public func execute() async throws {
        userDefaults.register(defaults: [kIsFirstRun: true])
        guard userDefaults.bool(forKey: kIsFirstRun) else {
            return
        }
        userDefaults.set(false, forKey: kIsFirstRun)
        try await setEnvironment(.prod)
        credentialProvider.setCredential(nil)
    }
}
