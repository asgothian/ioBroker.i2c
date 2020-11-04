import { SeesawHandlerBase } from './seesaw-handler-base';

export interface SeesawSoilConfig {
    /** in seconds */
    pollingInterval: number;
}

/**
 * Based on https://github.com/adafruit/Adafruit_Seesaw/blob/master/examples/soil_sensor/soilsensor_example/soilsensor_example.ino
 */
export default class SeesawSoil extends SeesawHandlerBase<SeesawSoilConfig> {
    async startAsync(): Promise<void> {
        this.debug('Starting');
        await this.adapter.extendObjectAsync(this.hexAddress, {
            type: 'device',
            common: {
                name: this.hexAddress + ' (' + this.name + ')',
                role: 'sensor',
            },
            native: this.config as any,
        });

        await this.adapter.extendObjectAsync(`${this.hexAddress}.temperature`, {
            type: 'state',
            common: {
                name: `${this.hexAddress} Temperature`,
                read: true,
                write: false,
                type: 'number',
                role: 'value.temperature',
                unit: '°C',
            },
        });

        await this.adapter.extendObjectAsync(`${this.hexAddress}.capacitive`, {
            type: 'state',
            common: {
                name: `${this.hexAddress} Capacitive`,
                read: true,
                write: false,
                type: 'number',
                role: 'value',
            },
        });

        if (!(await this.begin())) {
            throw new Error('Seesaw not found');
        }

        this.startPolling(async () => await this.readCurrentValuesAsync(), this.config.pollingInterval * 1000, 1000);
    }

    async stopAsync(): Promise<void> {
        this.debug('Stopping');
        this.stopPolling();
    }

    async readCurrentValuesAsync(): Promise<void> {
        const tempC = await this.getTemp();
        const capread = await this.touchRead(0);

        await this.setStateAckAsync('temperature', tempC);
        await this.setStateAckAsync('capacitive', capread);
    }
}