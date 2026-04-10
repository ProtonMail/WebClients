// swift-tools-version: 6.2
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(name: "Core",
                      products: [
                          .library(name: "Core", targets: ["Core"])
                      ],
                      targets: [
                          .target(name: "Core"),
                          .testTarget(name: "CoreTests", dependencies: ["Core"])
                      ])
