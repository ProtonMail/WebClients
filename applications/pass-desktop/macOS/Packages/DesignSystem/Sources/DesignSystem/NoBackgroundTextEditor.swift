//
// NoBackgroundTextEditor.swift
// Proton Pass - Created on 05/04/2023.
// Copyright (c) 2023 Proton Technologies AG
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

/// SwiftUI's`TextEditor` comes with background with no way to remove or customize
/// Wrap `NSTextView` to provide a text editor with no background
public struct NoBackgroundTextEditor: NSViewRepresentable {
    @Binding var text: String
    @Binding var calculatedHeight: CGFloat
    let placeholder: String
    let textStyle: NSFont.TextStyle

    public init(text: Binding<String>,
                calculatedHeight: Binding<CGFloat>,
                placeholder: String,
                textStyle: NSFont.TextStyle = .body) {
        _text = text
        _calculatedHeight = calculatedHeight
        self.placeholder = placeholder
        self.textStyle = textStyle
    }

    public func makeNSView(context: Context) -> NSScrollView {
        let scrollView = NSScrollView()
        scrollView.drawsBackground = false

        let textView = PlaceholderTextView()
        textView.placeholder = placeholder
        textView.drawsBackground = false
        textView.delegate = context.coordinator
        textView.font = .preferredFont(forTextStyle: textStyle)
        textView.textContainer?.lineFragmentPadding = 0
        textView.autoresizingMask = [.width]
        scrollView.documentView = textView
        return scrollView
    }

    public func updateNSView(_ nsView: NSScrollView, context _: Context) {
        if let textView = nsView.documentView as? NSTextView {
            if textView.string != text {
                textView.string = text
            }
            Self.recalculateHeight(view: textView, result: $calculatedHeight)
        }
    }

    static func recalculateHeight(view: NSTextView, result: Binding<CGFloat>) {
        if let layoutManager = view.layoutManager, let textContainer = view.textContainer {
            layoutManager.ensureLayout(for: textContainer)
            let usedRect = layoutManager.usedRect(for: textContainer)

            // Update the binding only if the height has actually changed
            if result.wrappedValue != usedRect.size.height {
                DispatchQueue.main.async {
                    result.wrappedValue = usedRect.size.height
                }
            }
        }
    }

    public func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    public class Coordinator: NSObject, NSTextViewDelegate {
        var parent: NoBackgroundTextEditor

        init(_ parent: NoBackgroundTextEditor) {
            self.parent = parent
        }

        public func textDidChange(_ notification: Notification) {
            if let textView = notification.object as? NSTextView {
                parent.text = textView.string
                NoBackgroundTextEditor.recalculateHeight(view: textView, result: parent.$calculatedHeight)
            }
        }
    }
}

private final class PlaceholderTextView: NSTextView {
    var placeholder = ""

    override func draw(_ dirtyRect: NSRect) {
        super.draw(dirtyRect)

        if string.isEmpty {
            let attributes: [NSAttributedString.Key: Any] = [
                .foregroundColor: NSColor.placeholderTextColor,
                .font: font ?? NSFont.preferredFont(forTextStyle: .body, options: [:])
            ]
            let xPosition = textContainerInset.width + (textContainer?.lineFragmentPadding ?? 0)
            let yPosition = textContainerInset.height

            placeholder.draw(at: NSPoint(x: xPosition, y: yPosition), withAttributes: attributes)
        }
    }
}
