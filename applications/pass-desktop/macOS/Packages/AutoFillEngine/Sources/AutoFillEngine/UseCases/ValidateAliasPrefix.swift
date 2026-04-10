//
// ValidateAliasPrefix.swift
// Proton Pass - Created on 02/01/2026.
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
//

import PassRustCore

protocol ValidateAliasPrefixUseCase: Sendable {
    func execute(prefix: String) throws(AliasPrefixError)
}

extension ValidateAliasPrefixUseCase {
    func callAsFunction(prefix: String) throws(AliasPrefixError) {
        try execute(prefix: prefix)
    }
}

final class ValidateAliasPrefix: ValidateAliasPrefixUseCase {
    private let validator: any AliasPrefixValidatorProtocol

    init(validator: any AliasPrefixValidatorProtocol = AliasPrefixValidator()) {
        self.validator = validator
    }

    func execute(prefix: String) throws(AliasPrefixError) {
        do {
            try validator.validate(prefix: prefix)
        } catch {
            guard let aliasError = error as? PassRustCore.AliasPrefixError else {
                throw AliasPrefixError.unknown
            }
            throw aliasError.toEntitiesAliasPrefixError
        }
    }
}

private extension PassRustCore.AliasPrefixError {
    var toEntitiesAliasPrefixError: AliasPrefixError {
        switch self {
        case .DotAtTheBeginning:
            .dotAtTheStart

        case .DotAtTheEnd:
            .dotAtTheEnd

        case .InvalidCharacter:
            .disallowedCharacters

        case .PrefixEmpty:
            .emptyPrefix

        case .PrefixTooLong:
            .prefixToLong

        case .TwoConsecutiveDots:
            .twoConsecutiveDots
        }
    }
}
