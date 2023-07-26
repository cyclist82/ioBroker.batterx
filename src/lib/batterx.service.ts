import { get } from 'axios';

type ConfigType = 'command';

interface StateConfig {
	id: string;
	name: string;
	type: number;
	entity: number;
	unit: string;
	configType?: ConfigType;
}

export interface BatterXState {
	273: EntityOne;
	274: EntityOne;
	275: EntityOne;
	305: EntityOne;
	306: EntityOne;
	307: EntityOne;
	337: EntityOne;
	338: EntityOne;
	339: EntityOne;
	353: EntityOne;
	354: EntityOne;
	369: EntityOne;
	370: EntityOne;
	371: EntityOne;
	377: EntityOne;
	1042: EntityOne;
	1058: EntityOne;
	1074: EntityOne;
	1121: EntityOne;
	1297: EntityOne;
	1298: EntityOne;
	1299: EntityOne;
	1329: EntityOne;
	1330: EntityOne;
	1331: EntityOne;
	1361: EntityOne;
	1362: EntityOne;
	1363: EntityOne;
	1377: EntityOne;
	1378: EntityOne;
	1553: EntityOne;
	1554: EntityOne;
	1569: EntityOne;
	1570: EntityOne;
	1617: EntityOne;
	1618: EntityOne;
	1634: EntityZero;
	2321: { [key: string]: number };
	2337: { [key: string]: number };
	2465: { [key: string]: number };
	2833: EntityZero;
	2834: EntityZero;
	2835: EntityZero;
	2865: EntityZero;
	2866: EntityZero;
	2867: EntityZero;
	2897: { [key: string]: number };
	2898: { [key: string]: number };
	2899: { [key: string]: number };
	2913: { [key: string]: number };
	2914: EntityZero;
	3090: EntityOne;
	3106: EntityOne;
	3122: EntityOne;
	3169: EntityOne;
	3313: EntityOne;
	3314: EntityOne;
	24582: { [key: string]: number };
	logtime: Date;
}

export interface EntityZero {
	0: number;
}

export interface EntityOne {
	1: number;
}

export interface StateMapItem {
	name: string;
	collection: Collection;
	unit?: string;
}

const collections = ['upsInput'] as const;
type Collection = (typeof collections)[number];

const INVERTER_COMMANDS_TYPE = 20738;
const INVERTER_COMMANDS_ENTITY = 0;

export interface CommandConfig {
	name: string;
	text1: number;
}

export type CommandType = 'gridInjection' | 'batteryCharging' | 'batteryChargingAC' | 'batteryDischarging';

export const commandOptions: Record<CommandType, CommandConfig> = {
	gridInjection: {
		name: 'Grid Injection',
		text1: 1,
	},
	batteryCharging: {
		name: 'Battery Charging',
		text1: 2,
	},
	batteryChargingAC: {
		name: 'Battery Charging AC',
		text1: 3,
	},
	batteryDischarging: {
		name: 'Battery Discharging',
		text1: 4,
	},
};

export type Command = '0' | '1' | '2';
export type CommandState = '0' | '1' | '10' | '11';

export const COMMANDS: Record<Command, string> = {
	'0': 'Off',
	'1': 'On',
	'2': 'Auto',
};

export const COMMAND_STATES: Record<CommandState, string> = {
	'0': 'Off',
	'1': 'On',
	'10': 'Forced Off',
	'11': 'Forced On',
};

const getLsConfigs = (
	baseId: string,
	baseName: string,
	startType: number,
	unit: string,
	amount = 3,
	entity = 1,
): StateConfig[] =>
	[...Array(amount)].map((_, index) => ({
		id: `${baseId}${index + 1}`,
		name: `${baseName}${index + 1}`,
		type: startType + index,
		entity,
		unit,
	}));

export const getStatesMap = (): Record<string, StateConfig[]> => ({
	upsInput: [
		...getLsConfigs('voltageL', 'Voltage L', 273, 'V'),
		...getLsConfigs('currentL', 'Current L', 305, 'A'),
		...getLsConfigs('powerL', 'Power L', 337, 'W'),
		{
			id: 'powerTotal',
			name: 'Power Total',
			type: 353,
			entity: 1,
			unit: 'W',
		},
		{
			id: 'frequency',
			name: 'Frequency',
			type: 354,
			entity: 1,
			unit: 'Hz',
		},
	],
	upsOutput: [
		...getLsConfigs('voltageL', 'Voltage L', 1297, 'V'),
		...getLsConfigs('currentL', 'Current L', 1329, 'A'),
		...getLsConfigs('powerL', 'Power L', 1361, 'W'),
		{
			id: 'powerTotal',
			name: 'Power Total',
			type: 1377,
			entity: 1,
			unit: 'W',
		},
		{
			id: 'frequency',
			name: 'Frequency',
			type: 1378,
			entity: 1,
			unit: 'Hz',
		},
	],
	battery: [
		{
			id: 'voltageMinusN',
			name: 'Voltage Minus N',
			type: 1041,
			entity: 1,
			unit: 'V',
		},
		{
			id: 'voltagePlusN',
			name: 'Voltage Plus N',
			type: 1042,
			entity: 1,
			unit: 'V',
		},
		{
			id: 'currentMinus',
			name: 'Current Minus',
			type: 1057,
			entity: 1,
			unit: 'A',
		},
		{
			id: 'currentPlus',
			name: 'Current Plus',
			type: 1058,
			entity: 1,
			unit: 'A',
		},
		{
			id: 'currencyMinus%',
			name: 'Currency Minus %',
			type: 1073,
			entity: 1,
			unit: '%',
		},
		{
			id: 'currencyPlus%',
			name: 'Currency Plus %',
			type: 1074,
			entity: 1,
			unit: '%',
		},
	],
	solar: [
		...getLsConfigs('voltageX', 'Voltage X', 1553, 'V', 2, 1),
		...getLsConfigs('currentX', 'Current X', 1569, 'A', 2, 1),
		...getLsConfigs('powerX', 'Power X', 1617, 'W', 2, 1),
	],
	grid: [
		...getLsConfigs('voltageL', 'Voltage L', 2833, 'V', 3, 0),
		...getLsConfigs('currentL', 'Current L', 2865, 'A', 3, 0),
		...getLsConfigs('powerFactorL', 'Power Factor L', 2881, '', 3, 0),
		...getLsConfigs('powerL', 'Power L', 2897, 'W', 3, 0),
		{
			id: 'powerPotal',
			name: 'Power Total',
			type: 2913,
			entity: 0,
			unit: 'W',
		},
		{
			id: 'frequency',
			name: 'Frequency',
			type: 2914,
			entity: 0,
			unit: 'Hz',
		},
		{
			id: 'powerFactorTotal',
			name: 'Power Factor Total',
			type: 2915,
			entity: 0,
			unit: '',
		},
	],
	house: [
		...getLsConfigs('powerL', 'Power L', 2897, 'W', 3, 2),
		{
			id: 'powerTotal',
			name: 'Power Total',
			type: 2913,
			entity: 2,
			unit: 'W',
		},
	],
	commands: [
		...Object.entries(commandOptions).map(([id, { name, text1 }]) => ({
			id: `${id}State`,
			name: `${name} State`,
			type: 2465,
			entity: text1,
			unit: '',
			configType: 'command' as ConfigType,
		})),
	],
});

export class BatterXService {
	private url!: string;
	constructor(host: string) {
		this.url = `http://${host}/api.php`;
	}

	async getCurrent(): Promise<BatterXState | null> {
		try {
			const { data } = await get(this.url, { params: { get: 'currentstate' } });
			return data;
		} catch (ex) {
			return null;
		}
	}

	async sendCommand(type: CommandType, command: Command): Promise<void> {
		const text1 = Object.keys(commandOptions).indexOf(type) + 1;
		await get(this.url, {
			params: {
				set: 'command',
				type: INVERTER_COMMANDS_TYPE,
				entity: INVERTER_COMMANDS_ENTITY,
				text1,
				text2: command,
			},
		});
	}

	getCurrentSettingFromValue = (val: number): Command => {
		switch (val) {
			case 10:
				return '0';
			case 11:
				return '1';
			default:
				return '2';
		}
	};
}
