//
// AliasPrefixError.swift
// Proton Pass - Created on 02/01/2026.
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

enum AliasPrefixError: Error {
    case emptyPrefix
    case disallowedCharacters
    case twoConsecutiveDots
    case dotAtTheEnd
    case dotAtTheStart
    case prefixToLong
    case unknown

    var description: LocalizedStringKey {
        switch self {
        case .emptyPrefix:
            "Prefix can not be empty"

        case .disallowedCharacters:
            "Prefix must contain only lowercase alphanumeric (a-z, 0-9), dot (.), hyphen (-) & underscore (_)"

        case .twoConsecutiveDots:
            "Prefix can not contain 2 consecutive dots (..)"

        case .dotAtTheEnd:
            "Alias can not contain 2 consecutive dots (..)"

        case .dotAtTheStart:
            "Alias can not start with a dot (.)"

        case .prefixToLong:
            "The alias prefix is too long"

        case .unknown:
            "Invalid prefix"
        }
    }
}
