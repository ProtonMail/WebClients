//
// CreateLoginViewModel.swift
// Proton Pass - Created on 29/12/2025.
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

import FactoryKit
import Foundation

@MainActor
@Observable
final class CreateLoginViewModel {
    var title = ""
    var email = ""
    var username = ""
    var separateEmailUsername = false
    var password = ""
    var totpUri = ""
    var urls: [String] = [""]
    var note = ""
    var customFields: [CustomFieldUiModel] = []

    private(set) var passwordStrength: PasswordStrength?

    let url: String?

    var urlHost: String? {
        if let url, let url = URL(string: url) {
            url.host()
        } else {
            nil
        }
    }

    @ObservationIgnored
    private var aliasCreationInfo: AliasCreationInfo?

    @ObservationIgnored
    @LazyInjected(\UseCaseContainer.getPasswordStrength)
    private var getPasswordStrength

    init(url: String?) {
        if let url {
            title = url
            urls = [url]
        }
        self.url = url
    }
}

extension CreateLoginViewModel {
    func updateStrength() {
        passwordStrength = getPasswordStrength(password: password)
    }

    func set(_ info: AliasCreationInfo) {
        aliasCreationInfo = info
        email = "\(info.prefix)\(info.suffix.suffix)"
    }
}
