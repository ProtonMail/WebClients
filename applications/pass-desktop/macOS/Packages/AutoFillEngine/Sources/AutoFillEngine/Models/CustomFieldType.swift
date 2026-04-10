//
// CustomFieldType.swift
// Proton Pass - Created on 01/01/2026.
// Copyright (c) 2026 Proton Technologies AG
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

import SwiftUI

enum CustomFieldType: CaseIterable {
    case text, totp, hidden, date

    var title: LocalizedStringKey {
        switch self {
        case .text:
            "Text"

        case .totp:
            "2FA secret key (TOTP)"

        case .hidden:
            "Hidden"

        case .date:
            "Date"
        }
    }

    var placeholder: LocalizedStringKey {
        switch self {
        case .text:
            "Add text"

        case .totp:
            "Add 2FA secret key"

        case .hidden:
            "Add hidden text"

        case .date:
            "Date"
        }
    }

    var iconName: String {
        switch self {
        case .text:
            "text.alignleft"

        case .totp:
            "lock"

        case .hidden:
            "eye.slash"

        case .date:
            "calendar"
        }
    }
}
