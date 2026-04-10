//
// GetPasswordStrengthUseCase.swift
// Proton Pass - Created on 30/12/2025.
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
//

import PassRustCore

protocol GetPasswordStrengthUseCase: Sendable {
    func execute(password: String) -> PasswordStrength?
}

extension GetPasswordStrengthUseCase {
    func callAsFunction(password: String) -> PasswordStrength? {
        execute(password: password)
    }
}

final class GetPasswordStrength: GetPasswordStrengthUseCase {
    private let passwordScorer: any PasswordScorerProtocol

    init(passwordScorer: any PasswordScorerProtocol = PasswordScorer()) {
        self.passwordScorer = passwordScorer
    }

    func execute(password: String) -> PasswordStrength? {
        guard !password.isEmpty else {
            return nil
        }
        return switch passwordScorer.checkScore(password: password) {
        case .vulnerable:
            .vulnerable

        case .weak:
            .weak

        case .strong:
            .strong
        }
    }
}
