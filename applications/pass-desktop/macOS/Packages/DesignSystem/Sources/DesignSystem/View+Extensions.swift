//
// View+Extensions.swift
// Proton Pass - Created on 25/09/2025.
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

public extension View {
    func scrollViewEmbedded(axes: Axis.Set = .vertical,
                            showsIndicators: Bool = true) -> some View {
        ScrollView(axes, showsIndicators: showsIndicators) {
            self
        }
    }

    func buttonEmbedded(action: @escaping () -> Void) -> some View {
        Button(action: action) {
            self
        }
        .buttonStyle(.plain)
    }

    func plainListRow() -> some View {
        listRowSeparator(.hidden)
            .listRowInsets(.init(top: 0, leading: 0, bottom: 0, trailing: 0))
            .listRowBackground(Color.clear)
    }

    func showSpinner(_ showing: Bool, disabledWhenShowing: Bool = true) -> some View {
        ZStack {
            self
                .disabled(disabledWhenShowing && showing)
            if showing {
                ProgressView()
            }
        }
        .animation(.default, value: showing)
    }

    func groupBoxed(paddingEdges edges: Edge.Set = .all,
                    paddingLength length: CGFloat? = nil) -> some View {
        GroupBox {
            self
        }
        .padding(edges, length)
    }
}
