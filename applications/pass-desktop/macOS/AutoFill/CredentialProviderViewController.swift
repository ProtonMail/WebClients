//
// CredentialProviderViewController.swift
// Proton Pass - Created on 05/12/2025.
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

import AppKit
import AuthenticationServices
import AutoFillEngine
import SwiftUI

final class CredentialProviderViewController: ASCredentialProviderViewController {
    private lazy var coordinator = AutoFillCoordinator<CredentialProviderViewController>(context: extensionContext)

    private var lastChildViewController: NSViewController?
    private var spinner: NSProgressIndicator?

    override func viewWillLayout() {
        super.viewWillLayout()
        NSLayoutConstraint.activate([
            view.widthAnchor.constraint(greaterThanOrEqualToConstant: 450)
        ])
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        coordinator.delegate = self
    }

    override func prepareCredentialList(for serviceIdentifiers: [ASCredentialServiceIdentifier]) {
        coordinator.prepareCredentialList(for: serviceIdentifiers)
    }

    override func prepareInterfaceForExtensionConfiguration() {
        coordinator.prepareInterfaceForExtensionConfiguration()
    }

    override func prepareOneTimeCodeCredentialList(for serviceIdentifiers: [ASCredentialServiceIdentifier]) {
        coordinator.prepareOneTimeCodeCredentialList(for: serviceIdentifiers)
    }

    override func prepareCredentialList(for serviceIdentifiers: [ASCredentialServiceIdentifier],
                                        requestParameters: ASPasskeyCredentialRequestParameters) {
        coordinator.prepareCredentialList(for: serviceIdentifiers,
                                          requestParameters: requestParameters)
    }

    override func provideCredentialWithoutUserInteraction(for credentialRequest: any ASCredentialRequest) {
        coordinator.provideCredentialWithoutUserInteraction(for: credentialRequest)
    }

    override func prepareInterfaceToProvideCredential(for credentialRequest: any ASCredentialRequest) {
        coordinator.prepareInterfaceToProvideCredential(for: credentialRequest)
    }

    override func prepareInterface(forPasskeyRegistration registrationRequest: any ASCredentialRequest) {
        coordinator.prepareInterface(forPasskeyRegistration: registrationRequest)
    }
}

extension CredentialProviderViewController: AutoFillCoordinatorDelegate {
    func removeLastChildViewControllerFromParent() {
        lastChildViewController?.view.removeFromSuperview()
        lastChildViewController?.removeFromParent()
    }

    func setRootView(_ view: some View) -> NSViewController {
        let viewController = NSHostingController(rootView: view)
        addChild(viewController)
        viewController.view.translatesAutoresizingMaskIntoConstraints = false
        self.view.addSubview(viewController.view)
        NSLayoutConstraint.activate([
            viewController.view.topAnchor.constraint(equalTo: self.view.topAnchor),
            viewController.view.leadingAnchor.constraint(equalTo: self.view.leadingAnchor),
            viewController.view.bottomAnchor.constraint(equalTo: self.view.bottomAnchor),
            viewController.view.trailingAnchor.constraint(equalTo: self.view.trailingAnchor)
        ])
        return viewController
    }

    func setLastChildViewController(_ viewController: NSViewController) {
        lastChildViewController = viewController
    }

    func alert(error: any Error,
               title: String,
               cancelTitle: String,
               onCancel: @escaping () -> Void) {
        let alert = NSAlert()
        alert.messageText = title
        alert.informativeText = error.localizedDescription
        alert.alertStyle = .warning

        alert.addButton(withTitle: cancelTitle)

        if let window = view.window {
            alert.beginSheetModal(for: window) { _ in
                onCancel()
            }
        }
    }

    func showLoadingSpinner() {
        guard spinner == nil else { return }
        let spinner = NSProgressIndicator()
        spinner.style = .spinning
        spinner.controlSize = .regular
        spinner.isIndeterminate = true
        spinner.translatesAutoresizingMaskIntoConstraints = false

        view.addSubview(spinner)

        NSLayoutConstraint.activate([
            spinner.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            spinner.centerYAnchor.constraint(equalTo: view.centerYAnchor)
        ])

        spinner.startAnimation(nil)
        self.spinner = spinner
    }

    func hideLoadingSpinner() {
        spinner?.stopAnimation(nil)
        spinner?.removeFromSuperview()
        spinner = nil
    }
}
