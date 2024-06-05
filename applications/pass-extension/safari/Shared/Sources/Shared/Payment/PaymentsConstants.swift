//
// PaymentsConstants.swift
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

import ProtonCoreDataModel
import ProtonCorePayments

enum PaymentsConstants {
    static let inAppPurchaseIdentifiers: ListOfIAPIdentifiers = [
        "iospass_pass2023_12_usd_non_renewing_v1",
        "iospass_pass2023_passlaunch_12_usd_non_renewing",
        "iospass_bundle2022_12_usd_non_renewing"
    ]

    static let shownPlanNames: ListOfShownPlanNames = [
        "pass2023",
        "bundle2022",
        "family2022",
        "visionary2022",
        "bundlepro2022",
        "enterprise2022",
        "visionary",
        "passpro2024"
    ]

    static let clientApp = ClientApp.pass
}
