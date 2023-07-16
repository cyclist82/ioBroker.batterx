"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var utils = __toESM(require("@iobroker/adapter-core"));
var import_batterx = require("./lib/batterx.service");
class Batterx extends utils.Adapter {
  fetchInterval;
  constructor(options = {}) {
    super({
      ...options,
      name: "batterx"
    });
    this.on("ready", this.onReady.bind(this));
    this.on("stateChange", this.onStateChange.bind(this));
    this.on("unload", this.onUnload.bind(this));
  }
  async onReady() {
    console.log("ON READY");
    const { name, batterxHost } = this.config;
    if (!name || !batterxHost) {
      return;
    }
    this.setState("info.connection", false, true);
    const batterXService = new import_batterx.BatterXService(batterxHost);
    const current = await batterXService.getCurrent();
    await this.ensureStatesExist(name, current);
    this.fetchInterval = setInterval(() => this.updateCurrentStates(name, batterXService), 1e4);
  }
  onUnload(callback) {
    try {
      if (this.fetchInterval) {
        clearInterval(this.fetchInterval);
      }
      callback();
    } catch (e) {
      callback();
    }
  }
  onStateChange(id, state) {
    if (state) {
      this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
    } else {
      this.log.info(`state ${id} deleted`);
    }
  }
  async ensureStatesExist(instanceName, current) {
    await this.setObjectNotExistsAsync(instanceName, {
      type: "folder",
      common: { name: "name of the batterX device" },
      native: {}
    });
    Object.entries((0, import_batterx.getStatesMap)()).forEach(async ([collection, configs]) => {
      configs.forEach(async ({ id, name, unit, type, entity }) => {
        var _a;
        const val = (_a = current == null ? void 0 : current[type]) == null ? void 0 : _a[entity];
        if (val !== void 0) {
          const path = `${instanceName}.${collection}.${id}`;
          await this.setObjectNotExistsAsync(path, {
            type: "state",
            common: {
              name,
              type: "number",
              role: "indicator",
              read: true,
              write: false,
              unit
            },
            native: {}
          });
          await this.setState(path, { val, ack: true });
        }
      });
    });
  }
  async updateCurrentStates(instanceName, batterXService) {
    const current = await batterXService.getCurrent();
    Object.entries((0, import_batterx.getStatesMap)()).forEach(([collection, configs]) => {
      configs.forEach((config) => {
        var _a;
        const value = (_a = current == null ? void 0 : current[config.type]) == null ? void 0 : _a[config.entity];
        if (value) {
          const val = config.unit === "V" ? value / 100 : value;
          this.setState(`${instanceName}.${collection}.${config.id}`, { val, ack: true });
        } else {
          this.log.debug(`No value for ${config.name}`);
        }
      });
    });
  }
}
if (require.main !== module) {
  module.exports = (options) => new Batterx(options);
} else {
  (() => new Batterx())();
}
//# sourceMappingURL=main.js.map
