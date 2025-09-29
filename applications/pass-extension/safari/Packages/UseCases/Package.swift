// swift-tools-version: 6.2
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(name: "UseCases",
                      platforms: [.iOS(.v16), .macCatalyst(.v16), .macOS(.v14)],
                      products: [
                          .library(name: "UseCases", targets: ["UseCases"])
                      ],
                      dependencies: [
                          .package(name: "Client", path: "../Client"),
                          .package(name: "Models", path: "../Models")
                      ],
                      targets: [
                          .target(name: "UseCases",
                                  dependencies: [
                                      .product(name: "Client", package: "Client"),
                                      .product(name: "Models", package: "Models")
                                  ]),
                          .testTarget(name: "UseCasesTests", dependencies: ["UseCases"])
                      ])
