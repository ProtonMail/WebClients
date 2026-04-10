// swift-tools-version: 6.2
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(name: "DesignSystem",
                      defaultLocalization: "en",
                      platforms: [.macOS(.v14)],
                      products: [
                          .library(name: "DesignSystem", targets: ["DesignSystem"])
                      ],
                      targets: [
                          .target(name: "DesignSystem",
                                  resources: [.process("Resources")],
                                  swiftSettings: [
                                      .enableUpcomingFeature("NonisolatedNonsendingByDefault"),
                                      .enableUpcomingFeature("InferIsolatedConformances")
                                  ]),
                          .testTarget(name: "DesignSystemTests", dependencies: ["DesignSystem"])
                      ])
