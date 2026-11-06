// Deterministically derive transparent assets from the chosen GIF; no artwork is redrawn.
// Run from the repo root: swift scripts/prepare-cat-loader.swift (requires img2webp).
import Foundation
import ImageIO
import UniformTypeIdentifiers

let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let assets = root.appendingPathComponent("assets/loader")
let source = CGImageSourceCreateWithURL(assets.appendingPathComponent("pinterest-cat-original.gif") as CFURL, nil)!
let crop = CGRect(x: 400, y: 300, width: 412, height: 205)
let width = 412, height = 205
let temporary = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
try FileManager.default.createDirectory(at: temporary, withIntermediateDirectories: true)
defer { try? FileManager.default.removeItem(at: temporary) }
func writePNG(_ image: CGImage, _ url: URL) {
    let output = CGImageDestinationCreateWithURL(url as CFURL, UTType.png.identifier as CFString, 1, nil)!
    CGImageDestinationAddImage(output, image, nil)
    precondition(CGImageDestinationFinalize(output))
}
var arguments = ["-loop", "0", "-lossless"]
var darkArguments = arguments
var totalMilliseconds = 0
for frame in 0..<CGImageSourceGetCount(source) {
    let image = CGImageSourceCreateImageAtIndex(source, frame, nil)!.cropping(to: crop)!
    if frame == 0 { writePNG(image, assets.appendingPathComponent("cat-splash.png")) }
    let context = CGContext(data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: width * 4, space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
    context.draw(image, in: CGRect(x: 0, y: 0, width: width, height: height))
    let pixels = context.data!.assumingMemoryBound(to: UInt8.self)
    // Flood only the exterior white matte. Enclosed white eye details stay intact.
    var outside = [Bool](repeating: false, count: width * height)
    var queue = [Int]()
    func enqueue(_ index: Int) {
        if outside[index] { return }
        let p = index * 4
        if min(pixels[p], pixels[p + 1], pixels[p + 2]) <= 8 { return }
        outside[index] = true
        queue.append(index)
    }
    for x in 0..<width { enqueue(x); enqueue((height - 1) * width + x) }
    for y in 0..<height { enqueue(y * width); enqueue(y * width + width - 1) }
    var cursor = 0
    while cursor < queue.count {
        let index = queue[cursor]; cursor += 1
        let x = index % width, y = index / width
        if x > 0 { enqueue(index - 1) }
        if x + 1 < width { enqueue(index + 1) }
        if y > 0 { enqueue(index - width) }
        if y + 1 < height { enqueue(index + width) }
    }
    for index in 0..<(width * height) where outside[index] {
        let p = index * 4
        let matte = min(pixels[p], pixels[p + 1], pixels[p + 2])
        pixels[p] = 0; pixels[p + 1] = 0; pixels[p + 2] = 0
        pixels[p + 3] = 255 - matte
    }
    let light = context.makeImage()!
    let lightURL = temporary.appendingPathComponent("light-\(frame).png")
    writePNG(light, lightURL)
    if frame == 0 { writePNG(light, assets.appendingPathComponent("cat-inline-still.png")) }
    // A light silhouette with dark eye details remains legible on dark surfaces.
    for index in 0..<(width * height) {
        let p = index * 4, alpha = pixels[p + 3]
        pixels[p] = alpha - min(alpha, pixels[p])
        pixels[p + 1] = alpha - min(alpha, pixels[p + 1])
        pixels[p + 2] = alpha - min(alpha, pixels[p + 2])
    }
    let dark = context.makeImage()!
    let darkURL = temporary.appendingPathComponent("dark-\(frame).png")
    writePNG(dark, darkURL)
    if frame == 0 { writePNG(dark, assets.appendingPathComponent("cat-inline-dark-still.png")) }
    let properties = CGImageSourceCopyPropertiesAtIndex(source, frame, nil)! as NSDictionary
    let gif = properties[kCGImagePropertyGIFDictionary] as! NSDictionary
    let delay = (gif[kCGImagePropertyGIFUnclampedDelayTime] ?? gif[kCGImagePropertyGIFDelayTime]) as! Double
    let milliseconds = Int((delay * 1000).rounded())
    totalMilliseconds += milliseconds
    arguments += ["-d", String(milliseconds), lightURL.path]
    darkArguments += ["-d", String(milliseconds), darkURL.path]
}
for (inputs, filename) in [(arguments, "cat-inline.webp"), (darkArguments, "cat-inline-dark.webp")] {
    let encoder = Process()
    encoder.executableURL = URL(fileURLWithPath: "/usr/bin/env")
    encoder.arguments = ["img2webp"] + inputs + ["-o", assets.appendingPathComponent(filename).path]
    try encoder.run(); encoder.waitUntilExit()
    precondition(encoder.terminationStatus == 0)
    let transparent = temporary.appendingPathComponent(filename)
    let mux = Process()
    mux.executableURL = URL(fileURLWithPath: "/usr/bin/env")
    mux.arguments = ["webpmux", "-set", "bgcolor", "0,0,0,0", assets.appendingPathComponent(filename).path, "-o", transparent.path]
    try mux.run(); mux.waitUntilExit()
    precondition(mux.terminationStatus == 0)
    try FileManager.default.removeItem(at: assets.appendingPathComponent(filename))
    try FileManager.default.copyItem(at: transparent, to: assets.appendingPathComponent(filename))
}
print("Preserved \(CGImageSourceGetCount(source)) frames, \(totalMilliseconds) ms per cycle; cropped to \(width) × \(height).")
