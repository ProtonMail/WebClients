//
// UserDefaultsServicePlanDataStorage.swift
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

// swiftlint:disable:next todo
// TODO: Conform to Sendable
final class UserDefaultsServicePlanDataStorage: ServicePlanDataStorage {
    private enum StorageKeys: String {
        case servicePlansDetails = "Payments.servicePlansDetails"
        case defaultPlanDetails = "Payments.defaultPlanDetails"
        case currentSubscription = "Payments.currentSubscription"
        case credits = "Payments.credits"
        case paymentMethods = "Payments.paymentMethods"
        case paymentsBackendStatusAcceptsIAP = "Payments.paymentsBackendStatusAcceptsIAP"
    }

    var servicePlansDetails: [Plan]? {
        get { storageHelper.getter([Plan].self, key: .servicePlansDetails) }
        set { storageHelper.setter(value: newValue, key: .servicePlansDetails) }
    }

    var defaultPlanDetails: Plan? {
        get { storageHelper.getter(Plan.self, key: .defaultPlanDetails) }
        set { storageHelper.setter(value: newValue, key: .defaultPlanDetails) }
    }

    var currentSubscription: Subscription? {
        get { storageHelper.getter(Subscription.self, key: .currentSubscription) }
        set { storageHelper.setter(value: newValue, key: .currentSubscription) }
    }

    var credits: Credits? {
        get { storageHelper.getter(Credits.self, key: .credits) }
        set { storageHelper.setter(value: newValue, key: .credits) }
    }

    var paymentMethods: [PaymentMethod]? {
        get { storageHelper.getter([PaymentMethod].self, key: .paymentMethods) }
        set { storageHelper.setter(value: newValue, key: .paymentMethods) }
    }

    var paymentsBackendStatusAcceptsIAP: Bool {
        get { storageHelper.getter(Bool.self, key: .paymentsBackendStatusAcceptsIAP) ?? false }
        set { storageHelper.setter(value: newValue, key: .paymentsBackendStatusAcceptsIAP) }
    }

    private let storageHelper: StorageHelper<StorageKeys>

    init(storage: UserDefaults) {
        storageHelper = StorageHelper(storage: storage)
    }
}

private final class StorageHelper<StorageKeys>
    where StorageKeys: RawRepresentable, StorageKeys.RawValue == String {
    private let jsonEncoder = JSONEncoder()
    private let jsonDecoder = JSONDecoder()
    private let storage: UserDefaults

    init(storage: UserDefaults) {
        self.storage = storage
    }

    func getter<T>(_ type: T.Type, key: StorageKeys) -> T? where T: Codable {
        guard let data = storage.data(forKey: key.rawValue),
              let value = try? jsonDecoder.decode(T.self, from: data) else {
            return nil
        }
        return value
    }

    func setter(value: (some Codable)?, key: StorageKeys) {
        guard let value else {
            storage.removeObject(forKey: key.rawValue)
            return
        }
        guard let data = try? jsonEncoder.encode(value) else {
            return
        }
        storage.set(data, forKey: key.rawValue)
    }
}
