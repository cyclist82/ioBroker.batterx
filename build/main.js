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
  batterXService;
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
    const { name, batterxHost } = this.config;
    if (!name || !batterxHost) {
      return;
    }
    this.setState("info.connection", false, true);
    this.batterXService = new import_batterx.BatterXService(batterxHost);
    const current = await this.batterXService.getCurrent();
    await this.ensureStatesExist(name, current);
    this.fetchInterval = setInterval(() => this.updateCurrentStates(name, this.batterXService), 1e4);
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
    if (state && !state.ack) {
      const paths = id.split(".");
      const type = paths[paths.length - 1];
      this.batterXService.sendCommand(type, state.val);
    }
  }
  async ensureStatesExist(instanceName, current) {
    await this.setObjectNotExistsAsync(instanceName, {
      type: "folder",
      common: { name: "name of the batterX device" },
      native: {}
    });
    Object.entries((0, import_batterx.getStatesMap)()).forEach(async ([collection, configs]) => {
      configs.forEach(async ({ id, name, unit, type, entity, configType }) => {
        var _a;
        const val = (_a = current == null ? void 0 : current[type]) == null ? void 0 : _a[entity];
        if (val !== void 0) {
          const path = `${instanceName}.${collection}.${id}`;
          await this.setObjectNotExistsAsync(path, {
            type: "state",
            common: {
              name,
              type: "number",
              role: "state",
              read: true,
              write: false,
              unit,
              ...configType ? { states: import_batterx.COMMAND_STATES } : {}
            },
            native: {}
          });
          this.setState(path, { val, ack: true });
        }
      });
    });
    const settings = current["2465"];
    Object.entries(import_batterx.commandOptions).forEach(async ([id, { name }], index) => {
      const path = `${instanceName}.commands.${id}`;
      await this.setObjectNotExistsAsync(path, {
        type: "state",
        common: {
          name,
          type: "array",
          role: "state",
          read: true,
          write: true,
          states: import_batterx.COMMANDS
        },
        native: {}
      });
      await this.subscribeStatesAsync(path);
      const val = settings[index + 1];
      this.setState(path, { val: this.batterXService.getCurrentSettingFromValue(val), ack: true });
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
