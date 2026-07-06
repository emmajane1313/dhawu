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
    if (isFile(candidate)) return candidate;
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

  const source = fsSync.readFileSync(resolvedPath, "utf8");
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

const verbPath = path.join(root, "src/app/ridjin/traductor/rules/verb.ts");
const { matchVerbAt } = loadModule(verbPath);
const matches = matchVerbAt([{ source: "big" }], 0, "en");
console.log(matches.length, matches.map((m) => m.surface));
