function detectImageType(buffer) {
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return "";
}

function parsePngDimensions(buffer) {
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function parseJpegDimensions(buffer) {
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    const size = buffer.readUInt16BE(offset + 2);
    if (
      marker >= 0xc0 &&
      marker <= 0xcf &&
      ![0xc4, 0xc8, 0xcc].includes(marker)
    ) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }
    offset += 2 + size;
  }
  throw new Error("jpeg_dimensions_unavailable");
}

function parseWebpDimensions(buffer) {
  const chunkType = buffer.toString("ascii", 12, 16);
  if (chunkType === "VP8X") {
    return {
      width:
        1 +
        buffer[24] +
        (buffer[25] << 8) +
        (buffer[26] << 16),
      height:
        1 +
        buffer[27] +
        (buffer[28] << 8) +
        (buffer[29] << 16),
    };
  }
  if (chunkType === "VP8 ") {
    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff,
    };
  }
  if (chunkType === "VP8L") {
    const bits =
      buffer[21] |
      (buffer[22] << 8) |
      (buffer[23] << 16) |
      (buffer[24] << 24);
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
    };
  }
  throw new Error("webp_dimensions_unavailable");
}

function parseImageDimensions(buffer, mimeType) {
  if (mimeType === "image/png") return parsePngDimensions(buffer);
  if (mimeType === "image/jpeg") return parseJpegDimensions(buffer);
  if (mimeType === "image/webp") return parseWebpDimensions(buffer);
  throw new Error("unsupported_image_type");
}

module.exports = {
  detectImageType,
  parseImageDimensions,
};
