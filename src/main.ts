/*
 * Created with @iobroker/create-adapter v2.5.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
import * as utils from '@iobroker/adapter-core';
import { CronJob } from 'cron';
import {
	BatterXService,
	BatterXState,
	CLEAN_HISTORY,
	COMMANDS,
	COMMAND_STATES,
	Command,
	CommandType,
	commandOptions,
	getStatesMap,
} from './lib/batterx.service';

// Load your modules here, e.g.:
// import * as fs from "fs";

class Batterx extends utils.Adapter {
	private fetchInterval: NodeJS.Timeout | undefined;
	private batterXService!: BatterXService;
	public constructor(options: Partial<utils.AdapterOptions> = {}) {
		super({
			...options,
			name: 'batterx',
		});
		this.on('ready', this.onReady.bind(this));
		this.on('stateChange', this.onStateChange.bind(this));
		// this.on('objectChange', this.onObjectChange.bind(this));
		// this.on('message', this.onMessage.bind(this));
		this.on('unload', this.onUnload.bind(this));
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	private async onReady(): Promise<void> {
		// Initialize your adapter here
		const { name, batterxHost } = this.config;
		if (!name || !batterxHost) {
			return;
		}
		this.batterXService = new BatterXService(batterxHost);
		// Reset the connection indicator during startup
		const current = await this.batterXService.getCurrent();

		this.setState('info.connection', !!current, true);
		if (!!current) {
			await this.ensureStatesExist(name, current);

			this.fetchInterval = setInterval(() => this.updateCurrentStates(name), 10000);

			new CronJob({
				cronTime: '0 1 * * *',
				onTick: async () => await this.updateHistory(name),
				start: true,
			});
		}
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 */
	private onUnload(callback: () => void): void {
		try {
			// Here you must clear all timeouts or intervals that may still be active
			// clearTimeout(timeout1);
			// clearTimeout(timeout2);
			// ...
			// clearInterval(interval1);
			if (this.fetchInterval) {
				clearInterval(this.fetchInterval);
			}
			callback();
		} catch (e) {
			callback();
		}
	}

	// If you need to react to object changes, uncomment the following block and the corresponding line in the constructor.
	// You also need to subscribe to the objects with `this.subscribeObjects`, similar to `this.subscribeStates`.
	// /**
	//  * Is called if a subscribed object changes
	//  */
	// private onObjectChange(id: string, obj: ioBroker.Object | null | undefined): void {
	// 	if (obj) {
	// 		// The object was changed
	// 		this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
	// 	} else {
	// 		// The object was deleted
	// 		this.log.info(`object ${id} deleted`);
	// 	}
	// }

	/**
	 * Is called if a subscribed state changes
	 */
	private onStateChange(id: string, state: ioBroker.State | null | undefined): void {
		if (state && !state.ack) {
			const paths = id.split('.');
			const type = paths[paths.length - 1] as CommandType;
			this.batterXService.sendCommand(type, state.val as Command);
		}
	}

	// If you need to accept messages in your adapter, uncomment the following block and the corresponding line in the constructor.
	// /**
	//  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
	//  * Using this method requires "common.messagebox" property to be set to true in io-package.json
	//  */
	// private onMessage(obj: ioBroker.Message): void {
	// 	if (typeof obj === 'object' && obj.message) {
	// 		if (obj.command === 'send') {
	// 			// e.g. send email or pushover or whatever
	// 			this.log.info('send command');

	// 			// Send response in callback if required
	// 			if (obj.callback) this.sendTo(obj.from, obj.command, 'Message received', obj.callback);
	// 		}
	// 	}
	// }

	private async ensureStatesExist(instanceName: string, current: BatterXState): Promise<void> {
		await this.setObjectNotExistsAsync(instanceName, {
			type: 'folder',
			common: { name: 'name of the batterX device' },
			native: {},
		});
		Object.keys(CLEAN_HISTORY).forEach(async (key) => {
			const id = `${instanceName}.yesterday.${key}`;
			const name = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());

			await this.setObjectNotExistsAsync(id, {
				type: 'state',
				common: {
					name,
					type: 'number',
					role: 'state',
					read: true,
					write: false,
					unit: 'kwH',
				},
				native: {},
			});
			this.setState(id, { val: 0, ack: true });
		});
		Object.entries(getStatesMap()).forEach(async ([collection, configs]) => {
			configs.forEach(async ({ id, name, unit, type, entity, configType }) => {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				const val = current?.[type]?.[entity];
				const path = `${instanceName}.${collection}.${id}`;
				await this.setObjectNotExistsAsync(path, {
					type: 'state',
					common: {
						name,
						type: 'number',
						role: 'state',
						read: true,
						write: false,
						unit,
						...(configType ? { states: COMMAND_STATES } : {}),
					},
					native: {},
				});
				this.setState(path, { val: val || 0, ack: true });
			});
		});
		const settings = current['2465'];
		Object.entries(commandOptions).forEach(async ([id, { name }], index) => {
			const path = `${instanceName}.commands.${id}`;
			await this.setObjectNotExistsAsync(path, {
				type: 'state',
				common: {
					name,
					type: 'array',
					role: 'state',
					read: true,
					write: true,
					states: COMMANDS,
				},
				native: {},
			});
			await this.subscribeStatesAsync(path);
			const val = settings[index + 1];
			this.setState(path, { val: this.batterXService.getCurrentSettingFromValue(val), ack: true });
		});
	}

	private async updateCurrentStates(instanceName: string): Promise<void> {
		const current = await this.batterXService.getCurrent();
		Object.entries(getStatesMap()).forEach(([collection, configs]) => {
			configs.forEach((config) => {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				const value = current?.[config.type]?.[config.entity];
				if (!(value === undefined || value === null)) {
					// all voltages are send with 2 digits attached
					const val = config.unit === 'V' ? value / 100 : value;
					this.setState(`${instanceName}.${collection}.${config.id}`, { val, ack: true });
				}
			});
		});
	}

	private async updateHistory(instanceName: string): Promise<void> {
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
	// Export the constructor in compact mode
	module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new Batterx(options);
} else {
	// otherwise start the instance directly
	(() => new Batterx())();
}
