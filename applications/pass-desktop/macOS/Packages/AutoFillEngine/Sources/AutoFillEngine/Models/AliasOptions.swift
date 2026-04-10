//
// AliasOptions.swift
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

struct AliasOptions: Decodable {
    let suffixes: [Suffix]
    let mailboxes: [AliasLinkedMailbox]
    let canCreateAlias: Bool
}

struct Suffix: Decodable, Hashable {
    let suffix: String
    let domain: String
    let signedSuffix: String
    let isCustom: Bool
}

struct AliasLinkedMailbox: Decodable, Hashable, Equatable, Identifiable {
    let id: Int
    let email: String
}

extension AliasOptions {
    static var mock: Self {
        .init(suffixes: [
            .init(suffix: "@alias.proton.me",
                  domain: "alias.proton.me",
                  signedSuffix: "signed_suffix_1",
                  isCustom: false),
            .init(suffix: "@pm.me",
                  domain: "pm.me",
                  signedSuffix: "signed_suffix_2",
                  isCustom: false),
            .init(suffix: "@custom.domain.com",
                  domain: "custom.domain.com",
                  signedSuffix: "signed_suffix_3",
                  isCustom: true)
        ],
        mailboxes: [
            .init(id: 1, email: "user@proton.me"),
            .init(id: 2, email: "secondary@pm.me"),
            .init(id: 3, email: "work@company.com")
        ],
        canCreateAlias: true)
    }
}
