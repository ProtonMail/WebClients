//
// LoadPlugin.swift
// Proton Pass - Created on 19/05/2024.
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

public protocol LoadPluginUseCase: Sendable {
    func execute(bundle: Bundle,
                 bundleFileName: String,
                 className: String) -> (any Plugin)?
}

public extension LoadPluginUseCase {
    func callAsFunction(bundle: Bundle,
                        bundleFileName: String = "MacPlugin.bundle",
                        className: String = "MacPlugin.MacPlugin") -> (any Plugin)? {
        execute(bundle: bundle, bundleFileName: bundleFileName, className: className)
    }
}

public final class LoadPlugin: Sendable, LoadPluginUseCase {
    public init() {}

    public func execute(bundle: Bundle,
                        bundleFileName: String,
                        className: String) -> (any Plugin)? {
        // 1. Form the plugin's bundle URL
        guard let bundleURL = bundle.builtInPlugInsURL?
            .appendingPathComponent(bundleFileName) else { return nil }

        // 2. Create a bundle instance with the plugin URL
        guard let bundle = Bundle(url: bundleURL) else { return nil }

        // 3. Load the bundle and our plugin class
        guard let pluginClass = bundle.classNamed(className) as? Plugin.Type else { return nil }

        // 4. Create an instance of the plugin class
        let plugin = pluginClass.init()
        return plugin
    }
}
