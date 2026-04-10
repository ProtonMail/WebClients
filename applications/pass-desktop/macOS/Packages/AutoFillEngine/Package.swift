// swift-tools-version: 6.2
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(name: "AutoFillEngine",
                      defaultLocalization: "en",
                      platforms: [.macOS("14.4")],
                      products: [
                          .library(name: "AutoFillEngine", targets: ["AutoFillEngine"])
                      ],
                      dependencies: [
                          .package(name: "Core", path: "../Core"),
                          .package(name: "DesignSystem", path: "../DesignSystem"),
                          .package(name: "PassRustCore", path: "../PassRustCore"),
                          .package(url: "https://github.com/hmlongco/Factory", exact: "2.5.3"),
                          .package(url: "https://github.com/protonpass/swift-macro", exact: "1.0.0")
                      ],
                      targets: [
                          .target(name: "AutoFillEngine",
                                  dependencies: [
                                      .product(name: "Core", package: "Core"),
                                      .product(name: "DesignSystem", package: "DesignSystem"),
                                      .product(name: "Macro", package: "swift-macro"),
                                      .product(name: "PassRustCore", package: "PassRustCore"),
                                      .product(name: "FactoryKit", package: "Factory")
                                  ],
                                  resources: [.process("Resources")],
                                  swiftSettings: [
                                      .enableUpcomingFeature("NonisolatedNonsendingByDefault"),
                                      .enableUpcomingFeature("InferIsolatedConformances")
                                  ]),
                          .testTarget(name: "AutoFillEngineTests", dependencies: ["AutoFillEngine"])
                      ])
