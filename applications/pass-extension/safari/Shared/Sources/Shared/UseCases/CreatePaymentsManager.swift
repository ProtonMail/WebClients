//
// CreatePaymentsManager.swift
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

import Foundation
import ProtonCorePayments
import ProtonCoreServices

public protocol CreatePaymentsManagerUseCase {
    func execute(environment: PassEnvironment,
                 credentials: Credentials,
                 apiService: any APIService) -> PaymentsManager
}

public extension CreatePaymentsManagerUseCase {
    func callAsFunction(environment: PassEnvironment,
                        credentials: Credentials,
                        apiService: any APIService) -> PaymentsManager {
        execute(environment: environment,
                credentials: credentials,
                apiService: apiService)
    }
}

public final class CreatePaymentsManager: CreatePaymentsManagerUseCase {
    private let userDefaults: UserDefaults
    private let tokenStorage: any PaymentTokenStorage

    public init(userDefaults: UserDefaults = .standard,
                tokenStorage: any PaymentTokenStorage = InMemoryTokenStorage()) {
        self.userDefaults = userDefaults
        self.tokenStorage = tokenStorage
    }

    public func execute(environment: PassEnvironment,
                        credentials: Credentials,
                        apiService: any APIService) -> PaymentsManager {
        PaymentsManager(userDefaults: userDefaults,
                        credentials: credentials,
                        tokenStorage: tokenStorage,
                        apiService: apiService)
    }
}
