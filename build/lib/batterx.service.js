"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var batterx_service_exports = {};
__export(batterx_service_exports, {
  BatterXService: () => BatterXService,
  getStatesMap: () => getStatesMap
});
module.exports = __toCommonJS(batterx_service_exports);
var import_axios = require("axios");
const collections = ["upsInput"];
const getLsConfigs = (baseId, baseName, startType, unit, amount = 3, entity = 1) => [...Array(amount)].map((_, index) => ({
  id: `${baseId}${index + 1}`,
  name: `${baseName}${index + 1}`,
  type: startType + index,
  entity,
  unit
}));
const getStatesMap = () => ({
  upsInput: [
    ...getLsConfigs("voltageL", "Voltage L", 273, "V"),
    ...getLsConfigs("currentL", "Current L", 305, "A"),
    ...getLsConfigs("powerL", "Power L", 337, "W"),
    {
      id: "powerTotal",
      name: "Power Total",
      type: 353,
      entity: 1,
      unit: "W"
    },
    {
      id: "frequency",
      name: "Frequency",
      type: 354,
      entity: 1,
      unit: "Hz"
    }
  ],
  upsOutput: [
    ...getLsConfigs("voltageL", "Voltage L", 1297, "V"),
    ...getLsConfigs("currentL", "Current L", 1329, "A"),
    ...getLsConfigs("powerL", "Power L", 1361, "W"),
    {
      id: "powerTotal",
      name: "Power Total",
      type: 1377,
      entity: 1,
      unit: "W"
    },
    {
      id: "frequency",
      name: "Frequency",
      type: 1378,
      entity: 1,
      unit: "Hz"
    }
  ],
  battery: [
    {
      id: "voltageMinusN",
      name: "Voltage Minus N",
      type: 1041,
      entity: 1,
      unit: "V"
    },
    {
      id: "voltagePlusN",
      name: "Voltage Plus N",
      type: 1042,
      entity: 1,
      unit: "V"
    },
    {
      id: "currentMinus",
      name: "Current Minus",
      type: 1057,
      entity: 1,
      unit: "A"
    },
    {
      id: "currentPlus",
      name: "Current Plus",
      type: 1058,
      entity: 1,
      unit: "A"
    },
    {
      id: "currencyMinus%",
      name: "Currency Minus %",
      type: 1073,
      entity: 1,
      unit: "%"
    },
    {
      id: "currencyPlus%",
      name: "Currency Plus %",
      type: 1074,
      entity: 1,
      unit: "%"
    }
  ],
  solar: [
    ...getLsConfigs("voltageX", "Voltage X", 1553, "V", 2, 1),
    ...getLsConfigs("currentX", "Current X", 1569, "A", 2, 1),
    ...getLsConfigs("powerX", "Power X", 1617, "W", 2, 1)
  ],
  grid: [
    ...getLsConfigs("voltageL", "Voltage L", 2833, "V", 3, 0),
    ...getLsConfigs("currentL", "Current L", 2865, "A", 3, 0),
    ...getLsConfigs("powerFactorL", "Power Factor L", 2881, "", 3, 0),
    ...getLsConfigs("powerL", "Power L", 2897, "W", 3, 0),
    {
      id: "powerPotal",
      name: "Power Total",
      type: 2913,
      entity: 0,
      unit: "W"
    },
    {
      id: "frequency",
      name: "Frequency",
      type: 2914,
      entity: 0,
      unit: "Hz"
    },
    {
      id: "powerFactorTotal",
      name: "Power Factor Total",
      type: 2915,
      entity: 0,
      unit: ""
    }
  ],
  house: [
    ...getLsConfigs("powerL", "Power L", 2897, "W", 3, 2),
    {
      id: "powerTotal",
      name: "Power Total",
      type: 2913,
      entity: 2,
      unit: "W"
    }
  ]
});
class BatterXService {
  url;
  constructor(host) {
    this.url = `http://${host}/api.php`;
  }
  async getCurrent() {
    const { data } = await (0, import_axios.get)(this.url, { params: { get: "currentstate" } });
    return data;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BatterXService,
  getStatesMap
});
//# sourceMappingURL=batterx.service.js.map
