// swift-tools-version: 6.2
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(name: "Client",
                      platforms: [.iOS(.v16), .macCatalyst(.v16), .macOS(.v14)],
                      products: [
                          .library(name: "Client", targets: ["Client"])
                      ],
                      dependencies: [
                          .package(name: "Models", path: "../Models"),
                          .package(url: "https://github.com/lukacs-m/SimpleKeychain", exact: "0.1.2"),
                          .package(url: "https://github.com/ProtonMail/protoncore_ios", exact: "32.7.0")
                      ],
                      targets: [
                          .target(name: "Client",
                                  dependencies: [
                                      .product(name: "Models", package: "Models"),
                                      .product(name: "SimpleKeychain", package: "SimpleKeychain"),
                                      .product(name: "ProtonCoreAuthentication", package: "protoncore_ios"),
                                      .product(name: "ProtonCoreChallenge", package: "protoncore_ios"),
                                      .product(name: "ProtonCoreCryptoGoImplementation",
                                               package: "protoncore_ios"),
                                      .product(name: "ProtonCoreDoh", package: "protoncore_ios"),
                                      .product(name: "ProtonCoreForceUpgrade", package: "protoncore_ios"),
                                      .product(name: "ProtonCoreHumanVerification", package: "protoncore_ios"),
                                      .product(name: "ProtonCoreNetworking", package: "protoncore_ios"),
                                      .product(name: "ProtonCorePaymentsUIV2", package: "protoncore_ios")
                                  ]),
                          .testTarget(name: "ClientTests", dependencies: ["Client"])
                      ])
