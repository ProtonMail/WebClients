//
// PassDoH.swift
// Proton Pass - Created on 17/05/2024.
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

import Foundation
import Models
import ProtonCoreDoh

public final class PassDoH: DoH, ServerConfig {
    public let environment: PassEnvironment
    public let signupDomain: String
    public let captchaHost: String
    public let humanVerificationV3Host: String
    public let accountHost: String
    public let defaultHost: String
    public let apiHost: String
    public let defaultPath: String
    public let proxyToken: String?

    public init(environment: PassEnvironment) {
        self.environment = environment
        switch environment {
        case .prod:
            signupDomain = "proton.me"
            captchaHost = "https://pass-api.proton.me"
            humanVerificationV3Host = "https://verify.proton.me"
            accountHost = "https://account.proton.me"
            defaultHost = "https://pass-api.proton.me"
            apiHost = "pass-api.proton.me"
            defaultPath = ""
            proxyToken = nil

        case .black:
            signupDomain = "proton.black"
            captchaHost = "https://api.proton.black"
            humanVerificationV3Host = "https://verify.proton.black"
            accountHost = "https://account.proton.black"
            defaultHost = "https://proton.black"
            apiHost = "dmfygsltqojxxi33onvqws3bomnua.protonpro.xyz"
            defaultPath = "/api"
            proxyToken = nil

        case let .scientist(name):
            signupDomain = "\(name).proton.black"
            captchaHost = "https://api.proton.black"
            humanVerificationV3Host = "https://verify.proton.black"
            accountHost = "https://account.\(name).proton.black"
            defaultHost = "https://\(name).proton.black"
            apiHost = "pass-api.\(name).proton.black"
            defaultPath = "/api"
            proxyToken = nil
        }
    }
}
