//
// PaymentsManager.swift
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

import Combine
import Foundation
import Models
@preconcurrency import OSLog
import ProtonCorePaymentsUIV2
import ProtonCorePaymentsV2
import ProtonCoreServices

public final class PaymentsManager: Sendable {
    private let paymentsV2: PaymentsV2
    private let transactionsObserver: any TransactionsObserverProviding
    private nonisolated(unsafe) var cancellables = Set<AnyCancellable>()
    private let logger: Logger

    private let appVersion: String
    private let sessionID: String
    private let authToken: String
    private let doh: PassDoH

    public init(paymentsV2: PaymentsV2 = .init(),
                transactionsObserver: any TransactionsObserverProviding = TransactionsObserver.shared,
                appVersion: String,
                sessionID: String,
                authToken: String,
                doh: PassDoH) {
        self.paymentsV2 = paymentsV2
        self.transactionsObserver = transactionsObserver
        logger = Logger(subsystem: Bundle.main.bundleIdentifier ?? "ProtonPass",
                        category: String(describing: Self.self))

        self.appVersion = appVersion
        self.sessionID = sessionID
        self.authToken = authToken
        self.doh = doh
    }
}

public extension PaymentsManager {
    func setUp() async {
        let configuration = TransactionsObserverConfiguration(sessionID: sessionID,
                                                              authToken: authToken,
                                                              appVersion: appVersion,
                                                              doh: doh)

        transactionsObserver.setConfiguration(configuration)

        do {
            try await transactionsObserver.start()
        } catch {
            logger.error("\(error.localizedDescription, privacy: .public)")
        }
    }

    func manageSubscription(isUpgrading: Bool,
                            completion: @escaping (Result<Bool, any Error>) -> Void) {
        do {
            try paymentsV2.showAvailablePlans(presentationMode: .modal,
                                              sessionID: sessionID,
                                              accessToken: authToken,
                                              appVersion: appVersion,
                                              hideCurrentPlan: isUpgrading,
                                              doh: doh)
            paymentsV2.transactionProgress
                .dropFirst()
                .receive(on: DispatchQueue.main)
                .sink { [weak self] value in
                    guard let self else { return }
                    switch value {
                    case .transactionCompleted:
                        completion(.success(true))
                        paymentsV2.dismissPayments()
                    case .transactionCancelledByUser:
                        completion(.success(false)) // to be updated
                    case .mismatchTransactionIDs,
                         .transactionProcessError,
                         .unableToGetUserTransactionUUID,
                         .unknownError:
                        completion(.success(false)) // to be updated
                    default:
                        logger.error("\("\(value) not handled", privacy: .public)")
                    }
                }
                .store(in: &cancellables)
        } catch {
            completion(.failure(error))
        }
    }
}
