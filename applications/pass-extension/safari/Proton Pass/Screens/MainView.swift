//
// MainView.swift
// Proton Pass - Created on 21/05/2024.
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

struct MainView: View {
    @StateObject private var viewModel = MainViewModel()

    var body: some View {
        ZStack {
            view(for: viewModel.state)
        }
        .preferredColorScheme(.dark)
        .tint(.accent)
        .animation(.default, value: viewModel.state)
        .onAppear(perform: hideTitleBarOnCatalyst)
        .task { await viewModel.refreshState() }
    }
}

private extension MainView {
    @ViewBuilder
    func view(for state: MainViewModelState) -> some View {
        switch state {
        case .loading:
            ProgressView()
        case .loggedOut:
            LoggedOutView()
        case let .loggedIn(environment, credentials):
            LoggedInView(viewModel: .init(environment: environment,
                                          credentials: credentials))
        case let .error(error):
            RetryableErrorView(error: error,
                               onRetry: { Task { await viewModel.refreshState() } })
        }
    }

    func hideTitleBarOnCatalyst() {
        #if targetEnvironment(macCatalyst)
        (UIApplication.shared.connectedScenes.first as? UIWindowScene)?.titlebar?.titleVisibility = .hidden
        #endif
    }
}
