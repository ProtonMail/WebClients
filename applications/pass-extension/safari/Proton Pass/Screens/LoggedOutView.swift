//
// LoggedOutView.swift
// Proton Pass - Created on 18/05/2024.
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

struct LoggedOutView: View {
    @StateObject private var viewModel = LoggedOutViewModel()

    var body: some View {
        VStack(alignment: .center) {
            LogoView()
                .padding(.vertical)
            HStack {
                step1
                Divider()
                step2
            }
            .frame(maxWidth: .infinity)
        }
    }
}

private extension LoggedOutView {
    func stepNumber(_ number: Int) -> some View {
        Text("\(number)")
            .padding(8)
            .background(.accent)
            .clipShape(Circle())
    }

    func stepDescription(_ description: String) -> some View {
        Text(description)
            .multilineTextAlignment(.center)
            .font(.headline.weight(.medium))
    }

    func stepImage(_ named: String) -> some View {
        Image(named)
            .resizable()
            .scaledToFit()
            .frame(width: 600)
    }

    var step1: some View {
        VStack(alignment: .center) {
            stepNumber(1)
            stepDescription("Enable Proton Pass in Safari Extensions preferences.")
            Button(action: { viewModel.openSafari() },
                   label: { Text("Open Safari") })
                .buttonStyle(.borderedProminent)
            stepImage("Step1")
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
    }

    var step2: some View {
        VStack(alignment: .center) {
            stepNumber(2)
            stepDescription("Sign into your Proton account.")
            Spacer()
            stepImage("Step2")
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
    }
}
