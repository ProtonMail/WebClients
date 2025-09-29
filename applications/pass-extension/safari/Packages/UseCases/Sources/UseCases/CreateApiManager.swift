//
// CreateApiManager.swift
// Proton Pass - Created on 22/05/2024.
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
import Models

public protocol CreateApiManagerUseCase: Sendable {
    func execute(environment: PassEnvironment, credentials: Credentials) -> ApiManager
}

public extension CreateApiManagerUseCase {
    func callAsFunction(environment: PassEnvironment, credentials: Credentials) -> ApiManager {
        execute(environment: environment, credentials: credentials)
    }
}

public final class CreateApiManager: Sendable, CreateApiManagerUseCase {
    private let appVersion: String
    private let credentialProvider: any CredentialProvider

    public init(appVersion: String,
                credentialProvider: any CredentialProvider) {
        self.appVersion = appVersion
        self.credentialProvider = credentialProvider
    }

    public func execute(environment: PassEnvironment, credentials: Credentials) -> ApiManager {
        ApiManager(appVersion: appVersion,
                   doh: PassDoH(environment: environment),
                   credentials: credentials,
                   credentialProvider: credentialProvider)
    }
}
