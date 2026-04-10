//
// SquircleThumbnail.swift
// Proton Pass - Created on 02/10/2025.
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

import Foundation
import SwiftUI

public enum SquircleThumbnailData {
    case icon(Data)
    case initials(String)
}

public struct SquircleThumbnail: View {
    let data: SquircleThumbnailData
    let tintColor: Color
    let backgroundColor: Color
    let height: CGFloat

    public init(data: SquircleThumbnailData,
                tintColor: Color,
                backgroundColor: Color,
                height: CGFloat = 40) {
        self.data = data
        self.tintColor = tintColor
        self.backgroundColor = backgroundColor
        self.height = height
    }

    public var body: some View {
        ZStack {
            backgroundColor
                .clipShape(RoundedRectangle(cornerRadius: height / 2.5, style: .continuous))

            switch data {
            case let .icon(data):
                let icon = if let image = Image(data: data) {
                    image
                } else {
                    Image(systemName: "questionmark")
                }
                icon
                    .resizable()
                    .renderingMode(.template)
                    .scaledToFit()
                    .foregroundStyle(tintColor)
                    .padding(.vertical, height / 3.5)

            case let .initials(string):
                Text(string)
                    .font(.system(size: height / 3))
                    .fontWeight(.medium)
                    .foregroundStyle(tintColor)
            }
        }
        .frame(width: height, height: height)
    }
}
