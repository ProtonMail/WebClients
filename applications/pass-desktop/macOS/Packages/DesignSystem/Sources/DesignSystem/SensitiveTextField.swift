//
// SensitiveTextField.swift
// Proton Pass - Created on 30/12/2025.
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
//

import SwiftUI

/// Show clear text when focused and show masked text when not focused
public struct SensitiveTextField<Field: Hashable>: View {
    let title: LocalizedStringKey
    let focusedField: FocusState<Field>.Binding
    let field: Field
    let value: Binding<String>

    public init(title: LocalizedStringKey,
                focusedField: FocusState<Field>.Binding,
                field: Field,
                value: Binding<String>) {
        self.title = title
        self.focusedField = focusedField
        self.field = field
        self.value = value
    }

    public var body: some View {
        TextField(title,
                  text: focusedField.wrappedValue == field ?
                      value : .constant(String(repeating: "•", count: value.wrappedValue.count)))
            .focused(focusedField, equals: field)
            .textFieldStyle(.plain)
            .autocorrectionDisabled()
    }
}
