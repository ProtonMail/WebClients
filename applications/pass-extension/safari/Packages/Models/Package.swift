// swift-tools-version: 6.2
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(name: "Models",
                      platforms: [.iOS(.v16), .macCatalyst(.v16), .macOS(.v14)],
                      products: [
                          .library(name: "Models", targets: ["Models"])
                      ],
                      targets: [
                          .target(name: "Models"),
                          .testTarget(name: "ModelsTests", dependencies: ["Models"])
                      ])
