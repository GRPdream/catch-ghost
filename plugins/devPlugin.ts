import { ViteDevServer } from "vite";
import { spawn } from 'child_process'
import esbuild from "esbuild"
interface AddressInfo {
  address: string;
  family: string;
  port: number;
}
export const devPlugin = () => {
  return {
    name: "dev-plugin",
    configureServer(server: ViteDevServer) {
        esbuild.buildSync({
        entryPoints: ["./src/main/mainEntry.ts"],
        bundle: true,
        platform: "node",
        outfile: "./dist/mainEntry.js",
        external: ["electron"],
      });
      server.httpServer.once("listening", () => {
        // let { spawn } = require("child_process");
        let addressInfo = server.httpServer.address() as AddressInfo;
        let httpAddress = `http://${addressInfo.address}:${addressInfo.port}`;
        let electronProcess = spawn("node_modules\\electron\\dist\\electron.exe", ["./dist/mainEntry.js", httpAddress], {
          cwd: process.cwd(),
          stdio: "inherit",
        });
        electronProcess.on("close", () => {
          server.close();
          process.exit();
        });
      });
    },
  };
};

export const getReplacer = () => {
  let externalModels = ["os", "fs", "path", "events", "child_process", "crypto", "http", "buffer", "url", "better-sqlite3", "knex"];
  let result = {};
  for (let item of externalModels) {
    result[item] = () => ({
      find: new RegExp(`^${item}$`),
      code: `const ${item} = require('${item}');export { ${item} as default }`,
    });
  }
  result["electron"] = () => {
    let electronModules = ["clipboard", "ipcRenderer", "nativeImage", "shell", "webFrame"].join(",");
    return {
      find: new RegExp(`^electron$`),
      code: `const {${electronModules}} = require('electron');export {${electronModules}}`,
    };
  };
  return result;
};