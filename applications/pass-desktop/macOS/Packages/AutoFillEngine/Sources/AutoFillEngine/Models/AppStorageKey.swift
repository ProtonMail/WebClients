//
// AppStorageKey.swift
// Proton Pass - Created on 23/12/2025.
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

import SwiftUI

enum AppStorageKey: String {
    case autoFillTrigger
    case oneTimeCodeAuthentication
    case copy2FaCode
    case showLastAutofillDate
    case showModificationDate
    case showCreationDate
    case dateDisplayFormat
    case sortOption
    case passwordType
    case passwordNumberOfCharacters
    case passwordSpecialCharacters
    case passwordCapitalLetters
    case passwordIncludeNumbers
    case passphraseNumberOfWords
    case passphraseWordSeparator
    case passphraseCapitalize
    case passphraseIncludeNumbers
}

extension AppStorage where Value == Bool {
    init(wrappedValue: Value, _ key: AppStorageKey, store: UserDefaults? = nil) {
        self.init(wrappedValue: wrappedValue, key.rawValue, store: store)
    }
}

extension AppStorage where Value == Int {
    init(wrappedValue: Value, _ key: AppStorageKey, store: UserDefaults? = nil) {
        self.init(wrappedValue: wrappedValue, key.rawValue, store: store)
    }
}

extension AppStorage where Value == Double {
    init(wrappedValue: Value, _ key: AppStorageKey, store: UserDefaults? = nil) {
        self.init(wrappedValue: wrappedValue, key.rawValue, store: store)
    }
}

extension AppStorage {
    init(wrappedValue: Value, _ key: AppStorageKey, store: UserDefaults? = nil)
        where Value: RawRepresentable, Value.RawValue == Int {
        self.init(wrappedValue: wrappedValue, key.rawValue, store: store)
    }
}
