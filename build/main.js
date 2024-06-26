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
var import_cron = require("cron");
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
    this.batterXService = new import_batterx.BatterXService(batterxHost);
    const current = await this.batterXService.getCurrent();
    this.setState("info.connection", !!current, true);
    if (!!current) {
      await this.ensureStatesExist(name, current);
      this.fetchInterval = setInterval(() => this.updateCurrentStates(name), 1e4);
      new import_cron.CronJob({
        cronTime: "0 1 * * *",
        onTick: async () => await this.updateHistory(name),
        start: true
      });
    }
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
    Object.keys(import_batterx.CLEAN_HISTORY).forEach(async (key) => {
      const id = `${instanceName}.yesterday.${key}`;
      const name = key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
      await this.setObjectNotExistsAsync(id, {
        type: "state",
        common: {
          name,
          type: "number",
          role: "state",
          read: true,
          write: false,
          unit: "kwH"
        },
        native: {}
      });
      this.setState(id, { val: 0, ack: true });
    });
    Object.entries((0, import_batterx.getStatesMap)()).forEach(async ([collection, configs]) => {
      configs.forEach(async ({ id, name, unit, type, entity, configType }) => {
        var _a;
        const val = (_a = current == null ? void 0 : current[type]) == null ? void 0 : _a[entity];
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
        this.setState(path, { val: val || 0, ack: true });
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
  async updateCurrentStates(instanceName) {
    const current = await this.batterXService.getCurrent();
    Object.entries((0, import_batterx.getStatesMap)()).forEach(([collection, configs]) => {
      configs.forEach((config) => {
        var _a;
        const value = (_a = current == null ? void 0 : current[config.type]) == null ? void 0 : _a[config.entity];
        if (!(value === void 0 || value === null)) {
          const val = config.unit === "V" ? value / 100 : value;
          this.setState(`${instanceName}.${collection}.${config.id}`, { val, ack: true });
        }
      });
    });
  }
  async updateHistory(instanceName) {
    const yesterday = await this.batterXService.getYesterdaySums();
    if (yesterday) {
      Object.entries(yesterday).forEach(([key, value]) => {
        const id = `${instanceName}.yesterday.${key}`;
        this.setState(id, { val: Math.round(value), ack: true });
      });
    }
  }
}
if (require.main !== module) {
  module.exports = (options) => new Batterx(options);
} else {
  (() => new Batterx())();
}
//# sourceMappingURL=main.js.map
