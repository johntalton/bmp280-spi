// eslint-disable-next-line import/no-nodejs-modules
const fs = require('fs');

const { Converter } = require('../');
const { Util } = require('./client-util.js');

class Config {
  static _getMs(cfg, name, defaultMs) {
    const s = cfg[name + 'S'];
    const ms = cfg[name + 'Ms'];

    // support using false to disable, including via base name
    // if(s === false || ms === false || (cfg[name] === false)) { return false; }

    if(s === undefined && ms === undefined) { return defaultMs; }

    const s_z = s !== undefined ? s : 0;
    const ms_z = ms !== undefined ? ms : 0;

    return s_z * 1000 + ms_z;
  }

  static config(path) {
    // eslint-disable-next-line promise/avoid-new
    return new Promise(resolve => {
      // eslint-disable-next-line promise/prefer-await-to-callbacks
      fs.readFile(path, (err, data) => {
        if(err) { resolve({}); return; }
        resolve(JSON.parse(data));
      });
    })
    .then(rawConfig => {
      if(rawConfig.devices === undefined) { throw new Error('no devices specified'); }
      const devices = rawConfig.devices.map((rawDevCfg, index) => {
        const name = rawDevCfg.name ? rawDevCfg.name : index;

        const active = rawDevCfg.active !== false;

        const sign = rawDevCfg.sign !== undefined ? rawDevCfg.sign : 'md5';

        const onStartSetProfile = rawDevCfg.onStartSetProfile !== undefined ? rawDevCfg.onStartSetProfile : true;

        const modeCheck = true;
        const sleepOnStreamStop = true;

        if(rawDevCfg.bus === undefined && rawDevCfg.bus.driver === undefined) { throw Error('undefined device bus', name); } 
        const busdriver = rawDevCfg.bus.driver;
        const busid = rawDevCfg.bus.id;

        if(rawDevCfg.profile === undefined) { throw Error('missing profile for device: ' + name); }
        const profile = { ...rawDevCfg.profile };
        profile.mode = profile.mode.toUpperCase();
        profile.spi = { enable3w: false };

        if(profile.mode === 'SLEEP') {
          console.log(' ** mode SLEEP, will poll but not measure (good for use with repl');
        }

        if(profile.gas !== undefined) {
          if(profile.gas.enabled === undefined) {
            console.log('gas enabled undefined, assume disabled');
            profile.gas.enabled = false;
          }

          profile.gas.setpoints = profile.gas.setpoints.map(sp => {
            const ms = Config._getMs(sp, 'duration', 0);
            const f = sp.tempatureF !== undefined ? Converter.ftoc(sp.tempatureF) : 0;
            const c = sp.tempatureC !== undefined ? sp.tempatureC : f;
            const active = sp.active !== undefined ? sp.active : false;
            return { tempatureC: c, durationMs: ms, active: active };
          });
        }

        const retryMs = Config._getMs(rawDevCfg, 'retryInterval', 30 * 1000);

        const pollMs = Config._getMs(rawDevCfg, 'pollInterval', 37 * 1000);
        

        return {
          active: active,
          name: name,
          sign: sign,
          bus: {
            driver: busdriver,
            id: busid
          },

          onStartSetProfile: onStartSetProfile,

          profile: profile,

          pollIntervalMs: pollMs,
          retryIntervalMs: retryMs,

          modeCheck: modeCheck,
          sleepOnStreamStop: sleepOnStreamStop
        };
      });

      let mqttReMs = 10 * 1000;
      if(rawConfig.mqtt) {
        const S = rawConfig.mqtt.reconnectS ? rawConfig.mqtt.reconnectS : 0;
        const Ms = rawConfig.mqtt.reconnectMs ? rawConfig.mqtt.reconnectMs : 0;
        mqttReMs = S * 1000 + Ms;
      }

      return {
        machine: Util.machine(),
        devices: devices,
        mqtt: {
          // eslint-disable-next-line no-process-env
          url: (rawConfig.mqtt && rawConfig.mqtt.url) ? rawConfig.mqtt.url : process.env.mqtturl,
          reconnectMs: mqttReMs
        }
      };
    });
  }
}

module.exports = Config;
