//
// AutoFillCoordinator.swift
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

import AuthenticationServices
import Core
import DesignSystem
import FactoryKit
@preconcurrency import LocalAuthentication
import Macro
import SwiftUI

@MainActor
public final class AutoFillCoordinator<Delegate: AutoFillCoordinatorDelegate> {
    @AppStorage(.oneTimeCodeAuthentication) private var oneTimeCodeAuthentication = true
    @LazyInjected(\UseCaseContainer.handleAutoFillAction) private var handleAutoFillAction
    @LazyInjected(\UseCaseContainer.handleCredentialRequest) private var handleCredentialRequest

    private let laPolicy = LAPolicy.deviceOwnerAuthentication
    private let context: ASCredentialProviderExtensionContext
    public weak var delegate: Delegate?

    public init(context: ASCredentialProviderExtensionContext) {
        self.context = context
    }
}

public extension AutoFillCoordinator {
    func setUpAndStart(mode: AutoFillMode) {
        switch mode {
        case .configuration:
            showConfigurationView()

        case let .autoFill(request):
            if #available(macOS 15.0, *),
               request is ASOneTimeCodeCredentialRequest,
               oneTimeCodeAuthentication {
                authenticateAndPerform { [weak self] in
                    guard let self else { return }
                    handle(request)
                }
            } else {
                handle(request)
            }

        case let .showAllLogins(serviceIdentifiers, passkeyCredentialRequestParams):
            ContextContainer.shared.register(serviceIdentifiers: serviceIdentifiers,
                                             passkeyCredentialRequestParams: passkeyCredentialRequestParams)
            authenticateAndPerform(showLoginListView)

        case .passkeyRegistration:
            break

        case .showOneTimeCodes:
            // Show all login items with 2FA set up to let users manually select and autofill 2FA code
            // But this seems to only be supported on iOS (broken since 18.4 or so).
            // On macOS if indexed logins don't match, then users have no way to trigger the extension.
            // Double check later if future macOS versions support this use case
            context.cancel(reason: .failed)

        case .textInsertion:
            // Text insertion is not supported on macOS/macCatalyst as of iOS/macOS 26
            context.cancel(reason: .failed)
        }
    }
}

// MARK: - UI presentation

private extension AutoFillCoordinator {
    func showView(_ view: some View) {
        guard let delegate else {
            context.cancelRequest(withError: AutoFillError.delegateNotSet)
            return
        }
        delegate.removeLastChildViewControllerFromParent()
        let viewController = delegate.setRootView(view)
        delegate.setLastChildViewController(viewController)
    }

    func showConfigurationView() {
        let view = ConfigurationView(isLoggedIn: .random()) { [weak self] in
            guard let self else { return }
            context.cancel(reason: .userCanceled)
        }
        showView(view)
    }

    func authenticateAndPerform(_ perform: @escaping @MainActor () -> Void) {
        var error: NSError?
        let reason = #localized("access information stored in Proton Pass")
        let laContext = LAContext()
        guard laContext.canEvaluatePolicy(laPolicy, error: &error) else {
            context.cancel(reason: .failed)
            return
        }

        laContext.evaluatePolicy(laPolicy, localizedReason: reason) { [weak self] authenticated, authError in
            guard let self else { return }
            Task { @MainActor [weak self] in
                guard let self else { return }
                if let authError {
                    if let laError = authError as? LAError,
                       laError.code == .userCancel {
                        context.cancel(reason: .userCanceled)
                    } else {
                        handle(authError)
                    }
                    return
                }
                if authenticated {
                    perform()
                } else {
                    context.cancel(reason: .failed)
                }
            }
        }
    }

    func showLoginListView() {
        let view = LoginListView(onResult: { [weak self] result in
            guard let self else { return }
            switch result {
            case let .success(action):
                handle(action)
            case let .failure(error):
                handle(error)
            }
        })
        showView(view)
    }
}

// MARK: - AutoFill operations

private extension AutoFillCoordinator {
    func handle(_ request: ASCredentialRequest) {
        perform { [weak self] in
            guard let self else { return }
            try await handleCredentialRequest(context: context, request: request)
        }
    }

    func handle(_ action: AutoFillAction) {
        perform { [weak self] in
            guard let self else { return }
            try await handleAutoFillAction(context: context, action: action)
        }
    }

    func perform(block: @escaping () async throws -> Void) {
        guard let delegate else {
            context.cancelRequest(withError: AutoFillError.delegateNotSet)
            return
        }
        Task { [weak self] in
            guard let self else { return }
            do {
                delegate.showLoadingSpinner()
                try await block()
                delegate.hideLoadingSpinner()
            } catch {
                delegate.hideLoadingSpinner()
                handle(error)
            }
        }
    }

    func handle(_ error: any Error) {
        guard let delegate else {
            context.cancelRequest(withError: AutoFillError.delegateNotSet)
            return
        }
        delegate.alert(error: error,
                       title: #localized("An error occurred"),
                       cancelTitle: #localized("Cancel"),
                       onCancel: { [weak self] in
                           guard let self else { return }
                           context.cancel(reason: .userCanceled)
                       })
    }
}
