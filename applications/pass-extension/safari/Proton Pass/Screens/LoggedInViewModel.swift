//
// LoggedInViewModel.swift
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

import Factory
import Foundation
import ProtonCoreNetworking
import ProtonCoreServices
import Shared

struct UserAndPlan: Sendable, Equatable {
    let plan: PassPlan
    let user: User
}

@MainActor
final class LoggedInViewModel: ObservableObject {
    @Published private(set) var userAndPlanObject: FetchableObject<UserAndPlan> = .fetching

    private let apiManager: ApiManager
    private let environment: PassEnvironment
    private let credentials: Credentials

    private var paymentsManager: PaymentsManager?

    private let setCoreLoggerEnvironment = resolve(\SharedUseCaseContainer.setCoreLoggerEnvironment)
    private let createApiManager = resolve(\SharedUseCaseContainer.createApiManager)
    private let getAccess = resolve(\SharedUseCaseContainer.getAccess)
    private let getUser = resolve(\SharedUseCaseContainer.getUser)
    private let createPaymentsManager = resolve(\SharedUseCaseContainer.createPaymentsManager)

    private var apiService: any APIService { apiManager.apiService }
    private let onLogOut: () -> Void

    init(environment: PassEnvironment,
         credentials: Credentials,
         onLogOut: @escaping () -> Void) {
        apiManager = createApiManager(environment: environment,
                                      credentials: credentials)
        self.environment = environment
        self.credentials = credentials
        self.onLogOut = onLogOut
        setCoreLoggerEnvironment(environment)
    }
}

extension LoggedInViewModel {
    func fetchUserAndPlan() async {
        do {
            if userAndPlanObject.isError {
                userAndPlanObject = .fetching
            }
            async let accessRequest = getAccess(apiService)
            async let userRequest = getUser(apiService)
            let (access, user) = try await (accessRequest, userRequest)
            userAndPlanObject = .fetched(.init(plan: access.plan, user: user))
        } catch {
            if let responseError = error as? ResponseError,
               responseError.httpCode == 401 {
                onLogOut()
            } else {
                userAndPlanObject = .error(error)
            }
        }
    }

    func upgrade() {
        let paymentsManager = makePaymentsManagerIfNotExist()
        paymentsManager.upgradeSubscription { [weak self] result in
            guard let self else { return }
            switch result {
            case .success:
                printIfDebug("Success")
            case let .failure(error):
                printIfDebug(error.localizedDescription)
            }
        }
    }

    func manageSubscription() {
        let paymentsManager = makePaymentsManagerIfNotExist()
        paymentsManager.manageSubscription { [weak self] result in
            guard let self else { return }
            switch result {
            case .success:
                printIfDebug("Success")
            case let .failure(error):
                printIfDebug(error.localizedDescription)
            }
        }
    }
}

private extension LoggedInViewModel {
    func makePaymentsManagerIfNotExist() -> PaymentsManager {
        if let paymentsManager {
            return paymentsManager
        }
        let paymentsManager = createPaymentsManager(environment: environment,
                                                    credentials: credentials,
                                                    apiService: apiService)
        self.paymentsManager = paymentsManager
        return paymentsManager
    }

    func printIfDebug(_ message: String) {
        #if DEBUG
        print(message)
        #endif
    }
}
