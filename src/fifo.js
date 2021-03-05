/* eslint-disable immutable/no-mutation */
/* eslint-disable immutable/no-this */
/* eslint-disable fp/no-this */
/* eslint-disable fp/no-mutation */
/* eslint-disable fp/no-nil */
/**
 * Instance Helper for Interacting with static chips via the Sensor.
 * Wrap calls into the chips static fifo methods and is accessible
 *   via the sensors fifo property (creating a name space for higher level
 *   API).
 **/
export class BoschFifo {
  constructor(sensor) {
    this.sensor = sensor
  }

  // eslint-disable-next-line require-await
  async flush() { return this.sensor.chip.fifo.flush(this.sensor._bus) }

  // eslint-disable-next-line require-await
  async read() { return this.sensor.chip.fifo.read(this.sensor._bus, this.sensor._calibration) }
}
