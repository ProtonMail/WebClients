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
import os.log
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
    @Published var error: (any Error)?

    private let apiManager: ApiManager
    private let environment: PassEnvironment
    private let credentials: Credentials
    private let logger: Logger

    private lazy var paymentsManager = PaymentsManager(appVersion: appVersion,
                                                       sessionID: credentials.sessionID,
                                                       authToken: credentials.accessToken,
                                                       doh: PassDoH(environment: environment),
                                                       createLogger: createLogger)

    private let setCoreLoggerEnvironment = resolve(\SharedUseCaseContainer.setCoreLoggerEnvironment)
    private let createApiManager = resolve(\SharedUseCaseContainer.createApiManager)
    private let createLogger = resolve(\SharedUseCaseContainer.createLogger)
    private let getAccess = resolve(\SharedUseCaseContainer.getAccess)
    private let getUser = resolve(\SharedUseCaseContainer.getUser)
    private let appVersion = resolve(\SharedToolingContainer.appVersion)

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
        logger = createLogger(category: String(describing: Self.self))
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
            async let paymentSetUp = paymentsManager.setUp
            let (access, user, _) = try await (accessRequest, userRequest, paymentSetUp)

            await paymentsManager.setUp()
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

    func beginPaymentFlow(isUpgrading: Bool) {
        paymentsManager.manageSubscription(isUpgrading: isUpgrading) { [weak self] result in
            guard let self else { return }
            switch result {
            case let .success(successful):
                if successful {
                    Task { [weak self] in
                        guard let self else { return }
                        await fetchUserAndPlan()
                    }
                }
            case let .failure(error):
                handle(error)
            }
        }
    }
}

private extension LoggedInViewModel {
    func handle(_ error: any Error) {
        self.error = error
        logger.error("\(error.localizedDescription, privacy: .public)")
    }
}
