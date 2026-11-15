// metro.config.js
const path = require("path");
const fs = require("fs");
const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");

const defaultConfig = getDefaultConfig(__dirname);

/**
 * Middleware برای سرو کردن فایل‌های بازی از src/game/
 * فقط در حالت dev فعاله و به WebView اجازه میده
 * فایل‌های HTML/JS/CSS رو مستقیم از Metro بگیره.
 */
function gameAssetsMiddleware(req, res, next) {
  const url = req.url || "";

  // فقط مسیرهای /src/game/* رو سرو کن
  if (!url.startsWith("/src/game/")) {
    return next();
  }

  // پاک‌سازی query string
  const cleanPath = url.split("?")[0];

  // جلوگیری از path traversal (../)
  const safeRel = cleanPath.replace(/^\/src\/game\//, "").replace(/\.\./g, "");

  const filePath = path.join(__dirname, "src", "game", safeRel);

  // اطمینان از اینکه فایل داخل src/game هست
  const resolved = path.resolve(filePath);
  const allowedRoot = path.resolve(path.join(__dirname, "src", "game"));
  if (!resolved.startsWith(allowedRoot)) {
    res.statusCode = 403;
    res.end("Forbidden");
    return;
  }

  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
    res.statusCode = 404;
    res.end("Not found: " + safeRel);
    return;
  }

  const ext = path.extname(resolved).toLowerCase();

  const contentTypes = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".mjs": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".glb": "model/gltf-binary",
    ".gltf": "model/gltf+json",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
  };

  res.setHeader(
    "Content-Type",
    contentTypes[ext] || "application/octet-stream",
  );
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Access-Control-Allow-Origin", "*");

  fs.createReadStream(resolved).pipe(res);
}

const config = {
  resolver: {
    // اجازه بده Metro فایل‌های html رو هم به عنوان asset بشناسه
    assetExts: [...defaultConfig.resolver.assetExts, "html"],
    // جلوگیری از تلاش Metro برای parse کردن فایل‌های بازی
    sourceExts: defaultConfig.resolver.sourceExts,
  },
  server: {
    enhanceMiddleware: (middleware) => {
      return (req, res, next) => {
        // اول middleware بازی، بعد Metro
        gameAssetsMiddleware(req, res, () => middleware(req, res, next));
      };
    },
  },
  transformer: {
    // برای dev سریع‌تر
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};

module.exports = mergeConfig(defaultConfig, config);
