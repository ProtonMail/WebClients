//
// RetryableErrorView.swift
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

import SwiftUI

public struct RetryableErrorView: View {
    let error: String
    let onRetry: () -> Void

    public init(error: any Error, onRetry: @escaping () -> Void) {
        self.error = error.localizedDescription
        self.onRetry = onRetry
    }

    public init(error: String, onRetry: @escaping () -> Void) {
        self.error = error
        self.onRetry = onRetry
    }

    public var body: some View {
        VStack {
            Text(error)
            Button(action: onRetry,
                   label: { Text("Retry", bundle: .module) })
        }
    }
}
