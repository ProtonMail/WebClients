//
// HighlightText.swift
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

import SwiftUI

public struct HighlightText: View {
    private let texts: [Text]
    private let lineLimit: Int

    public init(text: String, highlight: String, lineLimit: Int) {
        self.lineLimit = lineLimit

        guard !highlight.isEmpty else {
            texts = [Text(text)]
            return
        }

        var result = [Text]()
        var lastIndex = text.startIndex

        // Use the Regex engine with ignoreCase
        // We escape the highlight string to ensure characters like "." or "?"
        // are treated as literal text, not regex commands.
        let pattern = NSRegularExpression.escapedPattern(for: highlight)
        let regex = try? Regex(pattern).ignoresCase()

        if let regex {
            let matches = text.ranges(of: regex)

            for range in matches {
                // Append the text before the match
                result.append(Text(text[lastIndex..<range.lowerBound]))

                // Append the match itself (preserving original casing)
                result.append(Text(text[range]).foregroundStyle(PassColor.interactionNormMajor2))

                lastIndex = range.upperBound
            }
        }

        // Append the remaining text
        result.append(Text(text[lastIndex...]))
        texts = result
    }

    public var body: some View {
        texts.toText
            .lineLimit(lineLimit)
            .multilineTextAlignment(.leading)
    }
}
