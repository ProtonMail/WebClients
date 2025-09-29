//
// Constants.swift
// Proton Pass - Created on 17/05/2024.
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

public let kSharedUserDefaults = UserDefaults(suiteName: Constants.appGroup)

public enum Constants: Sendable {
    public static let teamId = "2SB5Z68H26"
    public static let bundleId = "me.proton.pass.catalyst"
    public static let extensionBundleId = "me.proton.pass.catalyst.safari-extension"
    public static let appGroup = "group.me.proton.pass.catalyst"
    public static let keychainAccessGroup = "\(teamId).\(appGroup)"
    public static let appStoreUrl = "itms-apps://itunes.apple.com/app/id6502835663"
    public static let environmentKey = "ENVIRONMENT"
    public static let credentialsKey = "CREDENTIALS"
}
