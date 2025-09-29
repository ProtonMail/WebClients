//
// PassPlan.swift
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

import Foundation

public struct PassPlan: Decodable, Equatable, Sendable {
    /// ⚠️ Use `planType` instead
    /// Possible values: `free`, `plus`
    public let type: String

    /// Plan name for telemetry
    public let internalName: String

    /// Human readable plan name
    public let displayName: String

    /// Force hide the upgrade button independently of plan
    public let hideUpgrade: Bool

    public let trialEnd: Int?
    public let vaultLimit: Int?
    public let aliasLimit: Int?
    public let totpLimit: Int?

    /// Enum representation of `type`
    public enum PlanType {
        case free, plus, trial, business
    }

    public var planType: PlanType {
        switch type {
        case "plus":
            if let trialEnd, trialEnd > 0 {
                .trial
            } else {
                .plus
            }

        case "business":
            .business

        default:
            .free
        }
    }

    public var isFreeUser: Bool { planType == .free }

    public var isBusinessUser: Bool { planType == .business }

    public var isInTrial: Bool { planType == .trial }

    public init(type: String,
                internalName: String,
                displayName: String,
                hideUpgrade: Bool,
                trialEnd: Int? = nil,
                vaultLimit: Int? = nil,
                aliasLimit: Int? = nil,
                totpLimit: Int? = nil) {
        self.type = type
        self.internalName = internalName
        self.displayName = displayName
        self.hideUpgrade = hideUpgrade
        self.trialEnd = trialEnd
        self.vaultLimit = vaultLimit
        self.aliasLimit = aliasLimit
        self.totpLimit = totpLimit
    }
}
