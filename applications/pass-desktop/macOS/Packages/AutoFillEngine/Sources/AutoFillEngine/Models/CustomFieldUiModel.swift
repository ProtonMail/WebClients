//
// CustomFieldUiModel.swift
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

import Foundation

struct CustomFieldUiModel {
    let id = UUID().uuidString
    let type: CustomFieldType
    var title: String
    var value: String
    /// Only applicable to date custom field
    var date: Date

    init(type: CustomFieldType,
         title: String = "",
         value: String = "") {
        self.type = type
        self.title = title
        self.value = value
        if let timeInterval = Double(value) {
            date = Date(timeIntervalSince1970: timeInterval)
        } else {
            date = .now
        }
    }
}
