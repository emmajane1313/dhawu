import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import vm from "vm";
import ts from "typescript";

const root = process.cwd();
const moduleCache = new Map();

function resolveWithExtensions(basePath) {
  const isFile = (candidate) => {
    try {
      return fsSync.statSync(candidate).isFile();
    } catch {
      return false;
    }
  };
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.jsx`,
    `${basePath}.json`,
    path.join(basePath, "index.ts"),
    path.join(basePath, "index.tsx"),
    path.join(basePath, "index.js"),
    path.join(basePath, "index.jsx"),
    path.join(basePath, "index.json"),
  ];
  for (const candidate of candidates) {
    try {
      if (isFile(candidate)) return candidate;
    } catch {
      // ignore
    }
  }
  return null;
}

function resolveModule(specifier, fromFile) {
  if (specifier.startsWith("@/")) {
    const rel = specifier.slice(2);
    const target = path.join(root, "src", rel);
    const resolved = resolveWithExtensions(target);
    if (resolved) return resolved;
  }
  if (specifier.startsWith(".")) {
    const base = path.resolve(path.dirname(fromFile), specifier);
    const resolved = resolveWithExtensions(base);
    if (resolved) return resolved;
  }
  return null;
}

function loadModule(filePath) {
  const resolvedPath = path.resolve(filePath);
  if (moduleCache.has(resolvedPath)) return moduleCache.get(resolvedPath);

  if (resolvedPath.endsWith(".json")) {
    const json = JSON.parse(fsSync.readFileSync(resolvedPath, "utf8") ?? "{}");
    moduleCache.set(resolvedPath, json);
    return json;
  }

  const source = ts.sys.readFile(resolvedPath);
  if (source == null) {
    throw new Error(`Cannot read ${resolvedPath}`);
  }

  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2019,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.React,
      esModuleInterop: true,
      isolatedModules: true,
      importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove,
    },
    fileName: resolvedPath,
  });

  const module = { exports: {} };
  moduleCache.set(resolvedPath, module.exports);

  const customRequire = (specifier) => {
    const resolved = resolveModule(specifier, resolvedPath);
    if (resolved) return loadModule(resolved);
    return require(specifier);
  };

  const wrapper = `(function (exports, require, module, __filename, __dirname) {\n${transpiled.outputText}\n})`;
  const script = new vm.Script(wrapper, { filename: resolvedPath });
  const fn = script.runInThisContext();
  fn(module.exports, customRequire, module, resolvedPath, path.dirname(resolvedPath));
  return module.exports;
}

async function generateSection(mode, section) {
  const devSamplesPath = path.join(root, "src/app/ridjin/traductor/devSamples.ts");
  const traductorPath = path.join(root, "src/app/ridjin/traductor/index.ts");

  const devSamples = loadModule(devSamplesPath);
  const traductor = loadModule(traductorPath);

  const { buildDevSamplesReportChunks } = devSamples;
  const { translate } = traductor;

  if (typeof buildDevSamplesReportChunks !== "function" || typeof translate !== "function") {
    throw new Error("Missing dev-samples helpers or translate function.");
  }

  const filename = `dev-samples-${mode}-${section}.txt`;
  const filePath = path.join(root, filename);
  let append = false;
  await buildDevSamplesReportChunks(translate, mode, section, async (chunk) => {
    if (append) {
      await fs.appendFile(filePath, chunk, "utf8");
    } else {
      await fs.writeFile(filePath, chunk, "utf8");
      append = true;
    }
  });
  console.log(`wrote ${filename}`);
}

const mode = process.argv[2];
const section = process.argv[3];
if (!mode || !section) {
  console.error("Usage: node scripts/generate-dev-samples-section.mjs <mode> <section>");
  process.exit(1);
}

generateSection(mode, section).catch((error) => {
  console.error(error);
  process.exit(1);
});
