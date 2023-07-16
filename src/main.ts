/*
 * Created with @iobroker/create-adapter v2.5.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
import * as utils from '@iobroker/adapter-core';
import { BatterXService, BatterXState, getStatesMap } from './lib/batterx.service';

// Load your modules here, e.g.:
// import * as fs from "fs";

class Batterx extends utils.Adapter {
	private fetchInterval: NodeJS.Timer | undefined;
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
		console.log('ON READY');
		// Initialize your adapter here
		const { name, batterxHost } = this.config;
		if (!name || !batterxHost) {
			return;
		}
		// Reset the connection indicator during startup
		this.setState('info.connection', false, true);

		const batterXService = new BatterXService(batterxHost);
		const current = await batterXService.getCurrent();
		await this.ensureStatesExist(name, current);

		this.fetchInterval = setInterval(() => this.updateCurrentStates(name, batterXService), 10000);
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
		if (state) {
			// The state was changed
			this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
		} else {
			// The state was deleted
			this.log.info(`state ${id} deleted`);
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
		Object.entries(getStatesMap()).forEach(async ([collection, configs]) => {
			configs.forEach(async ({ id, name, unit, type, entity }) => {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				const val = current?.[type]?.[entity];
				if (val !== undefined) {
					const path = `${instanceName}.${collection}.${id}`;
					await this.setObjectNotExistsAsync(path, {
						type: 'state',
						common: {
							name,
							type: 'number',
							role: 'indicator',
							read: true,
							write: false,
							unit,
						},
						native: {},
					});
					await this.setState(path, { val, ack: true });
				}
			});
		});
	}

	private async updateCurrentStates(instanceName: string, batterXService: BatterXService): Promise<void> {
		const current = await batterXService.getCurrent();
		Object.entries(getStatesMap()).forEach(([collection, configs]) => {
			configs.forEach((config) => {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				const value = current?.[config.type]?.[config.entity];
				if (value) {
					// all voltages are send with 2 digits attached
					const val = config.unit === 'V' ? value / 100 : value;
					this.setState(`${instanceName}.${collection}.${config.id}`, { val, ack: true });
				} else {
					this.log.debug(`No value for ${config.name}`);
				}
			});
		});
	}
}

if (require.main !== module) {
	// Export the constructor in compact mode
	module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new Batterx(options);
} else {
	// otherwise start the instance directly
	(() => new Batterx())();
}
