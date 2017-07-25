var readline = require('readline');

const boschLib = require('./src/boschIEU.js');
const bosch = boschLib.BoschIEU;
const Converter = boschLib.Converter;

const chip = require('./src/chip.js');
const profiles = chip.profiles;

const rasbus = require('rasbus');
const spiImpl = rasbus.spi;
const i2cImpl = rasbus.i2cbus;

const Misc = require('./repl-misc.js');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  completer: completer
});

let commands = [
  { name: 'exit', callback: function(state){ rl.close(); } },
  { name: 'clear', callback: function(state) { console.log('\u001B[2J\u001B[0;0f'); } }
];

const seaLevelPa = 1013.25;
let state = { seaLevelPa: seaLevelPa };

function prompt() {
  const close = '> ';
  let prompt = close;
  if(state.sensor != undefined) {
    prompt = state.sensor.name + close;
    if(state.sensor.chip !== undefined) {
      prompt = state.sensor.chip.name + '@' + state.sensor._name + close;
    }
  }
  rl.question(prompt, commandHandler);
}


function finderPartial(partialCmd) {
  return function(item) {
    return item.name.toLowerCase().startsWith(partialCmd);
  };
}

function completer(line) {
  const partialCmd = line.split(' ')[0];
  const partials = commands.filter(finderPartial(partialCmd));

  let suggestions = partials.map(item => item.name);

  const exacts = partials.filter(finderFull(partialCmd));
  if(exacts.length > 1){ throw new Error(partialCmd); }
  if(exacts[0]) {
    if(exacts[0].completer) {
      //suggestions.push(...exacts[0].completer(line));
      return [exacts[0].completer(line), line];
    }
  }

  return [suggestions, line];
}


function finderFull(cmd) {
  return function(item) {
    if(item.name.toLowerCase() === cmd.toLowerCase()) {
      return true;
    }
    return false;
  };
}

function commandHandler(line) {
  const cmd = line.split(' ')[0];
  let item = commands.find(finderFull(cmd));
  if(item === undefined){ item = { callback: (foo) => Promise.resolve(foo) }; }
  
  state.line = line;
  item.callback(state).then(() => {
    //
    prompt();
  }).catch(e => {
    console.log('error', e);
    prompt();
  });
}




commands.push({
  name: 'init',
  completer: function(line) {
    return ['spi <id>', 'i2c <id>'];
  },
  callback: function(state) {
    const bus = state.line.split(' ')[1];
    const id = state.line.split(' ')[2];

    if(bus === 'i2c') {
      return i2cImpl.init(id).then(i2c => {
        console.log('i2c device inited');
        return bosch.sensor('name', i2c)
          .then(s => {
            console.log('sensor inited');
            state.sensor = s;
          });
      });
    } else if(bus === 'spi') {
      return spiImpl.init(device).then(spi => {
        console.log('spi device inited');
        return bosch.sensor(device, spi)
          .then(s => {
            sensor = s;
        });
      });
    } else {
      throw new Error('unknown bus ' + bus);
    }
  }
});





commands.push({
  name: 'id',
  callback: function (state) {
    return state.sensor.id().then(id => {
      console.log('Chip ID (' + id + '):'  + (state.sensor.valid() ? state.sensor.chip.name : ' (invalid)'));
    });
  }
});

commands.push({
  name: 'version',
  callback: function(state) {
    return state.sensor.version().then(version => {
      console.log('Version: ' + version.toString(16));
    });
  }
});

commands.push({
  name: 'reset',
  callback: function(state) {
    return state.sensor.reset().then(noop => {
      console.log('reset');
    });
  }
});

commands.push({
  name: 'status',
  callback: function(state) {
    return state.sensor.status().then(([measuring, im_update]) => {
      console.log('Measuing: ', measuring, ' Image Update: ', im_update);
    });
  }
});

/*  else if(cmd.toLowerCase() === 'status!') {
    Promise.all(Array(5000).fill().map(() => sensor.status())).then(results => {
      let prevm, prevu;
      results.map(([measuring, im_update]) => {
        if(measuring !== prevm || im_update !== prevu) {
          prevm = measuring;
          prevu = im_update;
          console.log('Measuring: ', measuring, ' Updating: ', im_update);
        }
      });
      prompt();
    }).catch(e => {
      console.log('error', e);
      prompt();
    });
  }
*/

commands.push({
  name: 'controlm',
  callback: function(state) {
    return state.sensor.controlMeasurment().then(([osrs_p, osrs_t, mode]) => {
      console.log('Mode: ', Misc.mode(sensor.chip, mode));
      console.log('Oversample Temp:  ' + Misc.oversample(sensor.chip, osrs_t));
      console.log('Oversample Press: ' + Misc.oversample(sensor.chip, osrs_p));
    });
  }
});

commands.push({
  name: 'controlh',
  callback: function(state) {
    return state.sensor.controlHumidity().then(([osrs_h]) => {
      console.log('Oversample Humi: ' + Misc.oversample(sensor.chip, osrs_h));
    });
  }
});

commands.push({
  name: 'config',
  callback: function(state) {
    return state.sensor.config().then(([t_sb, filter, spi3wire_en]) => {
      console.log('Normal Mode Timing: ', Misc.standby(sensor.chip, t_sb));
      console.log('IIR Filter: ' + Misc.coefficient(sensor.chip, filter));
    });
  }
});

commands.push({
  name: 'profile',
  callback: function(state) {
    return state.sensor.profile().then(profile => {
      // console.log(profile);
      console.log('Mode: ', Misc.mode(sensor.chip, profile.mode));
      console.log('Oversampling Press: ', Misc.oversample(sensor.chip, profile.oversampling_p));
      console.log('Oversampling Temp:  ', Misc.oversample(sensor.chip, profile.oversampling_t));
      console.log('Oversampling Humi:  ', Misc.oversample(sensor.chip, profile.oversampling_h));
      console.log('IIR Filter Coefficient: ', Misc.coefficient(sensor.chip, profile.filter_coefficient));
      console.log('Standby Time: ', Misc.standby(sensor.chip, profile.standby_time));
    });
  }
});

commands.push({
  name: 'calibration',
  callback: function(state) {
    return state.sensor.calibration().then(data => {
      calibration_data = data;
      const [dig_T1, dig_T2, dig_T3, dig_P1, dig_P2, dig_P3, dig_P4, dig_P5, dig_P6, dig_P7, dig_P8, dig_P9] = data;

      console.log('dig T1', dig_T1);
      console.log('dig T2', dig_T2);
      console.log('dig T3', dig_T3);
      console.log('dig P1', dig_P1);
      console.log('dig P2', dig_P2);
      console.log('dig P3', dig_P3);
      console.log('dig P4', dig_P4);
      console.log('dig P5', dig_P5);
      console.log('dig P6', dig_P6);
      console.log('dig P7', dig_P7);
      console.log('dig P8', dig_P8);
      console.log('dig P9', dig_P9);
    });
  }
});

commands.push({
  name: 'sleep',
  callback: function(state) {
    return state.sensor.sleep().then(noop => {
      console.log('sleep mode');
    });
  }
});

commands.push({
  name: 'normal',
  callback: function(state) {
    // console.log('normal mode', profiles.bmp280.MAX_STANDBY);
    return state.sensor.setProfile(profiles.bme280.MAX_STANDBY).then(noop => {
      console.log('normal mode');
    });
  }
});

commands.push({
  name: 'forced',
  callback: function(state) {
    return state.sensor.force().then(noop => {
      console.log('forced mode');
   });
  }
});

commands.push({
  name: 'pressure',
  callback: function(state) {
    const [,p1, p2, p3, p4, p5, p6, p7, p8, p9] = calibration_data;
    return state.sensor.pressure(p1, p2, p3, p4, p5, p6, p7, p8, p9).then(press => {
      console.log('Under pressure:', press);
      if(press.skip){

      } else if(press.undef) {

      } else {
        console.log('Pressure (Pa):', press);
      }
    });
  }
});

commands.push({
  name: 'tempature',
  callback: function(state) {
    const [t1, t2, t3, ...rest] = calibration_data;
    sensor.tempature(t1, t2, t3).then(temp => {
      if(temp.skip){
        console.log('Tempature sensing disabled');
      }else if(temp.undef){
        console.log('Tempature calibration unset:', temp.undef);
      }else{
        console.log('Tempature (c): ', trim(temp.cf), trim(temp.ci));
        console.log('          (f): ', trim(ctof(temp.cf)), trim(ctof(temp.ci)));
      }
    });
  }
});

commands.push({
  name: 'humidity',
  callback: function(state) {

  }
});


commands.push({
  name: 'altitude',
  callback: function(state) {
    return state.sensor.pressure(...(calibration_data.slice(3))).then(P => {
      const alt = bmp280.altitudeFromPressure(state.seaLevelPa, P);
      console.log('Altitude: ', alt);
    });
  }
});

/*
commands.push({
  name: '',
  callback: function(state) {

  }
});
*/



/*
  else if(cmd.toLowerCase() === 'poll') {
    let count = 0;
    let timer;

    function poll() {
      sensor.measurement(...calibration_data).then(([press, temp]) => {
        const now = new Date();

        count += 1;
        console.log('#' + count +  ' @ ' + now.getHours() + ':' + now.getMinutes());
        if(temp.skip){
          console.log('Tempature Skipped');
        } else if(temp.undef){
          console.log('Tempature calibration unset: ', temp.undef);
        }else {
          console.log('Tempature (c)', trim(temp.cf), trim(temp.ci));
          console.log('          (f)', trim(ctof(temp.cf)), trim(ctof(temp.ci)));
        }

        if(press.skip){
          console.log('Pressue Skipped');
        } else if(press.undef){
          console.log('Pressure calibration unset: ', press.undef);
        }else {
          console.log('Pressure (Pa)', trim(press));
        }

        timer = setTimeout(poll, 1000 * 1);
      }).catch(e => {
        console.log('error', e);
        prompt();
      })
    }

    poll();
    rl.question('', function(){ clearTimeout(timer); console.log('Poll Ended'); prompt(); });
  }
*/


prompt();
