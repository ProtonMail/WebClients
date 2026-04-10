//
// PasswordParams.swift
// Proton Pass - Created on 29/12/2025.
// Copyright (c) 2025 Proton Technologies AG
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

import DesignSystem
import Macro
import SwiftUI

enum PasswordStrength {
    case vulnerable, weak, strong

    var title: String {
        switch self {
        case .vulnerable:
            #localized("Vulnerable", bundle: .module)

        case .weak:
            #localized("Weak", bundle: .module)

        case .strong:
            #localized("Strong", bundle: .module)
        }
    }

    var imageName: String {
        switch self {
        case .vulnerable:
            "xmark.shield.fill"

        case .weak:
            "exclamationmark.shield.fill"

        case .strong:
            "checkmark.shield.fill"
        }
    }

    var color: Color {
        switch self {
        case .vulnerable:
            PassColor.signalDanger

        case .weak:
            PassColor.signalWarning

        case .strong:
            PassColor.signalSuccess
        }
    }
}

enum PasswordType: Int {
    case random = 0, memorable
}

enum PassphraseWordSeparator: Int, CaseIterable {
    case numbersAndSymbols = 0
    case numbers
    case underscores
    case commas
    case periods
    case spaces
    case hyphens
}
