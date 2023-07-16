import { get } from 'axios';

interface StateConfig {
	id: string;
	name: string;
	type: number;
	entity: number;
	unit: string;
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
});

export class BatterXService {
	private url!: string;
	constructor(host: string) {
		this.url = `http://${host}/api.php`;
	}

	async getCurrent(): Promise<BatterXState> {
		const { data } = await get(this.url, { params: { get: 'currentstate' } });
		return data;
	}
}
