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

import Foundation
import ProtonCorePayments
import ProtonCorePaymentsUI
import ProtonCoreServices

public final class PaymentsManager {
    public typealias PaymentsResult = Result<InAppPurchasePlan?, any Error>

    private let payments: Payments
    private let credentials: Credentials
    public let tokenStorage: (any PaymentTokenStorage)?

    private var paymentsUI: PaymentsUI?

    public init(userDefaults: UserDefaults,
                credentials: Credentials,
                tokenStorage: any PaymentTokenStorage,
                apiService: any APIService) {
        self.tokenStorage = tokenStorage
        self.credentials = credentials
        let dataStorage = UserDefaultsServicePlanDataStorage(storage: userDefaults)
        let payments = Payments(inAppPurchaseIdentifiers: PaymentsConstants.inAppPurchaseIdentifiers,
                                apiService: apiService,
                                localStorage: dataStorage,
                                reportBugAlertHandler: nil)
        self.payments = payments
        payments.storeKitManager.delegate = self
        initializePaymentsStack()
    }
}

public extension PaymentsManager {
    func manageSubscription(completion: @escaping (PaymentsResult) -> Void) {
        let paymentsUI = createPaymentsUI()
        paymentsUI.showCurrentPlan(presentationType: .modal, backendFetch: true) { [weak self] result in
            guard let self else { return }
            handlePaymentsResponse(result: result, completion: completion)
        }
    }

    func upgradeSubscription(completion: @escaping (PaymentsResult) -> Void) {
        let paymentsUI = createPaymentsUI()
        paymentsUI.showUpgradePlan(presentationType: .modal, backendFetch: true) { [weak self] reason in
            guard let self else { return }
            handlePaymentsResponse(result: reason, completion: completion)
        }
    }
}

private extension PaymentsManager {
    func initializePaymentsStack() {
        switch payments.planService {
        case let .left(service):
            service.currentSubscriptionChangeDelegate = self
        default:
            break
        }

        payments.storeKitManager.delegate = self
        payments.storeKitManager.subscribeToPaymentQueue()
    }

    func createPaymentsUI() -> PaymentsUI {
        let paymentsUI = PaymentsUI(payments: payments,
                                    clientApp: PaymentsConstants.clientApp,
                                    shownPlanNames: PaymentsConstants.shownPlanNames,
                                    customization: .init(inAppTheme: { .dark }))
        self.paymentsUI = paymentsUI
        return paymentsUI
    }

    func handlePaymentsResponse(result: PaymentsUIResultReason,
                                completion: @escaping (PaymentsResult) -> Void) {
        switch result {
        case let .purchasedPlan(accountPlan: plan):
            printIfDebug("Purchased plan: \(plan.protonName)")
            completion(.success(plan))
        case .open:
            break
        case let .planPurchaseProcessingInProgress(accountPlan: plan):
            printIfDebug("Purchasing \(plan.protonName)")
        case .close:
            printIfDebug("Payments closed")
            completion(.success(nil))
        case let .purchaseError(error: error):
            printIfDebug("Purchase failed with error \(error)")
            completion(.failure(error))
        case .toppedUpCredits:
            printIfDebug("Credits topped up")
            completion(.success(nil))
        case let .apiMightBeBlocked(message, originalError: error):
            printIfDebug("\(message), error \(error)")
            completion(.failure(error))
        }
    }

    func printIfDebug(_ message: String) {
        #if DEBUG
        print(message)
        #endif
    }
}

extension PaymentsManager: StoreKitManagerDelegate {
    public var isUnlocked: Bool { true }

    public var isSignedIn: Bool { true }

    public var activeUsername: String? { nil }

    public var userId: String? { credentials.userID }
}

extension PaymentsManager: CurrentSubscriptionChangeDelegate {
    public func onCurrentSubscriptionChange(old _: Subscription?, new _: Subscription?) {
        // Nothing to do here for now
    }
}
