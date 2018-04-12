"use strict";

const { Util } = require('./util.js');

/**
 *
 **/
class Compensate {
  static from(measurment, calibration) {
    switch(measurment.type) {
    case '2xy': return Compensate.from_2xy(measurment, calibration); break;
    case '6xy': return Compensate.from_6xy(measurment, calibration); break;
    default: throw Error('unknown measurement type: ' + measurment.type); break;
    }
  }

  static from_6xy(measurment, calibration) {
    const t = Compensate.tempature_6xy(measurment.adcT, calibration.T);
    return {
      tempature: t,
      pressure: Compensate.pressure_6xy(measurment.adcP, t.Tfine, calibration.P),
      humidity: Compensate.humidity_6xy(measurment.adcH, t.Tfine, calibration.H),
      gas: Compensate.gas_6xy(measurment.adcG, calibration.G)
    };
  }

  static tempature_6xy(adcT, caliT) {
    if(adcT === false) { return { adc: false, skip: true }; }

    if(caliT.length !== 3) { return { adc: adcT, skip: true, calibration: caliT.length }; }
    const [T1, T2, T3] = caliT;

    function tfloat() {
      const var1f = (adcT / 16384.0 - T1 / 1024.0) * T2;
      const var2f = (adcT / 131072.0 - T1 / 8192.0) * (adcT / 131072.0 - T1 / 8192.0) * T3;
      const Tfinef = var1f + var2f;
      const cf = Tfinef / 5120.0;

      return [cf, Tfinef];
    }
    function tint() {
      const var1i = (adcT >> 3) - (T1 << 1);
      const var2i = (var1i * T2) >> 11;
      const tmpi =  ((var1i >> 1) * (var1i >> 1)) >> 12;
      const var3i = (tmpi * (T3 << 4)) >> 14;
      const Tfinei = var2i + var3i;
      const ci = (Tfinei * 5 + 128) >> 8;

      return [ci, Tfinei];
    }

    const [iC, iTfine] = tint();
    const [fC, fTfine] = tfloat();

    //console.log(iC, iTfine, fC, fTfine);

    return { adc: adcT, C: fC, Tfine: fTfine };
  }

  static pressure_6xy(adcP, Tfine, caliP) {
    if(adcP === false) { return { adc: false, skip: true }; }

    if(caliP.length !== 10) { return { skip: true, calibration: caliP.length }; }
    const [ P1, P2, P3, P4, P5, P6, P7, P8, P9, P10 ] = caliP;

    function pfloat() {
      let var1 = (Tfine / 2.0) - 64000.0;
      let var2 = var1 * var1 * (P6 / 131072.0);
      var2 = var2 + (var1 * P5 * 2.0);
      var2 = (var2 / 4.0) + (P4 * 65536.0);
      var1 = (((P3 * var1 * var1) / 16384.0) + (P2 * var1)) / 524288.0;
      var1 = (1.0 + (var1 / 32768.0)) * P1;

      let pressure_hPa = 0;

      if(var1 !== 0) {
        let p = 1048576.0 - adcP;
        p = ((p - (var2 / 4096.0)) * 6250.0) / var1;
        var1 = (P9 * p * p) / 2147483648.0;
        var2 = p * (P8 / 32768.0);
        let var3 = ((p / 256.0) * (p / 256.0) * (p / 256.0) * (P10 / 131072.0));
        p = p + (var1 + var2 + var3 + (P7 * 128.0)) / 16;
        pressure_hPa = p / 100;
      }
      return pressure_hPa * 100;
    }

    const fPa = pfloat();

    return { adc: adcP, Pa: fPa, Tfine: Tfine };
  }

  static humidity_6xy(adcH, Tfine, caliH) {
    if(adcH === false) { return { adc: false, skip: true }; }

    if(caliH.length !== 7) { return { skip: true, calibration: caliH.length }; }
    const [H1, H2, H3, H4, H5, H6, H7] = caliH;

    function hfloat() {
      const temp_comp = Tfine / 5120.0;
      const var1 = adcH - ((H1 * 16.0) + ((H3 / 2.0) * temp_comp));
      const var2 = var1 * (((H2 / 262144.0) * (1.0 + ((H4 / 16384.0) * temp_comp) + ((H5 / 1048576.0) * temp_comp * temp_comp))));
      const var3 = H6 / 16384.0;
      const var4 = H7 / 2097152.0;
      const unclamped = var2 + ((var3 + (var4 * temp_comp)) * var2 * var2);
      const hum = Math.min(Math.max(unclamped, 0), 100); // clamp(0, 100)
      return [hum, unclamped];
    }

    const [hum, raw] = hfloat();

    return { adc: adcH, percent: hum, Hunclamped: raw, skip: false };
  }

  static gas_6xy(adcG, caliG) {
    // console.log(adcG, caliG);
    if(adcG === false) { return { adc: false, skip: true }; }

    const Gg = caliG.G;
    if(Gg.length !== 3) { return { skip: true, calibration: Gg.length }; }
    const [g1, g2, g3] = Gg;

    function gfloat() {
      const lookup1 = [ 0.0, 0.0, 0.0, 0.0, 0.0, -1.0, 0.0, -0.8, 0.0, 0.0, -0.2, -0.5, 0.0, -1.0, 0.0, 0.0 ];
      const lookup2 = [ 0.0, 0.0, 0.0, 0.0, 0.1, 0.7, 0.0, -0.8, -0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0 ];

      const var1 = (1340.0 + (5.0 * caliG.range_switching_error));
      const var2 = var1 * (1.0 + (lookup1[adcG.range] / 100.0));
      const var3 = 1.0 + (lookup2[adcG.range] / 100.0);
      const calc_gas_res = 1.0 / (var3 * (0.000000125) * (1 << adcG.range) * ((((adcG.resistance) - 512.0) / var2) + 1.0));
      return calc_gas_res;
    }

    function gint() {

    }

    /*
    const const_array1 = [1, 1, 1, 1, 1, 0.99, 1, 0.992, 1, 1, 0.998, 0.995, 1, 0.99, 1, 1];
    const const_array2 = [ 8000000, 4000000, 2000000, 1000000, 499500.4995,
      248262.1648, 125000, 63004.03226, 31281.28128, 15625,7812.5, 3906.25,
      1953.125, 976.5625, 488.28125, 244.140625 ];

    const var1 = (1340.0 + 5.0 * caliG.range_sw_err) * const_array1[gas_range];
    const gas_res = var1 * const_array2[gas_range] / (gas_r - 512.0 + var1);
    return gas_res;
    */


    const ohms = gfloat();

    return { adc: adcG, ohm: ohms, skip: !adcG.stable, stable: adcG.stable };
  }




  static from_2xy(measurment, calibration) {
    const ct = Compensate.tempature(measurment.adcT, calibration.T);
    const Tfine = ct.skip ? false : ct.Tfine;
    const cp = Compensate.pressure(measurment.adcP, Tfine, calibration.P);
    const ch = Compensate.humidity(measurment.adcH, Tfine, calibration.H);

    return {
      tempature: ct,
      pressure: cp,
      humidity: ch
    }
  }

  static tempature(adcT, caliT) {
    if(adcT === false) { return { adc: false, skip: true }; }

    if(caliT.length !== 3) { return { skip: true, calibration: caliT.length }; }
    const [dig_T1, dig_T2, dig_T3] = caliT;

    // console.log(T, dig_T1, dig_T2, dig_T3);
    if(dig_T1 === undefined){ return { undef: 't1' }; }
    if(dig_T2 === undefined){ return { undef: 't2' }; }
    if(dig_T3 === undefined){ return { undef: 't3' }; }

    const var1f = (adcT / 16384.0 - dig_T1 / 1024.0) * dig_T2;
    const var2f = (adcT / 131072.0 - dig_T1 / 8192.0) * (adcT / 131072.0 - dig_T1 / 8192.0) * dig_T3;
    const finef = var1f + var2f;
    const cf = finef / 5120.0;

/*
    const var1i = (((T >> 3) - (dig_T1 << 1)) * dig_T2) >> 11;
    const var2i = ( (( ((T >> 4) - dig_T1) * ((T >> 4) - dig_T1) ) >> 12) * dig_T3 ) >> 14;
    const finei = var1i + var2i;
    const ci = ((finei * 5 + 128) >> 8) / 100;
*/

    // console.log(var1f, var2f, finef, cf);
    // console.log(var1i, var2i, finei, ci);

    return {
      skip: false,
      adc: adcT,
      Tfine: finef,
      C: cf
    };
  }


  static pressure(adcP, Tfine, caliP) {
    if(adcP === false) { return { skip: true, adc: false }; }
    if(Tfine === false) { return { skip: true, Tfine: false }; }

    if(caliP.length !== 9) { return { skip: true, calibration: caliP.length } }
    const [ dig_P1, dig_P2, dig_P3, dig_P4, dig_P5, dig_P6, dig_P7, dig_P8, dig_P9 ] = caliP;

    let pvar1 = Tfine / 2 - 64000;
    let pvar2 = pvar1 * pvar1 * dig_P6 / 32768;
    pvar2 = pvar2 + pvar1 * dig_P5 * 2;
    pvar2 = pvar2 / 4 + dig_P4 * 65536;
    pvar1 = (dig_P3 * pvar1 * pvar1 / 524288 + dig_P2 * pvar1) / 524288;
    pvar1 = (1 + pvar1 / 32768) * dig_P1;

    let pressure_hPa = 0;

    if(pvar1 !== 0) {
      let p = 1048576 - adcP;
      p = ((p - pvar2 / 4096) * 6250) / pvar1;
      pvar1 = dig_P9 * p * p / 2147483648;
      pvar2 = p * dig_P8 / 32768;
      p = p + (pvar1 + pvar2 + dig_P7) / 16;
      pressure_hPa = p / 100;
    }
    return { adc: adcP, Pa: pressure_hPa * 100 };
  }

  static humidity(adcH, Tfine, caliH) {
    if(adcH === false) { return { skip: true, adc: false }; }
    if(Tfine === false) { return { skip: true, Tfine: false }; }

    if(caliH.length !== 6) { return { skip: true, calibration: caliH.length } }
    const [ dig_H1, dig_H2, dig_H3, dig_H4, dig_H5, dig_H6 ] = caliH;

    if(Tfine === undefined) { return { undef: 'Tfine' }; }
    if(dig_H1 === undefined) { return { undef: 'h1' }; }
    if(dig_H2 === undefined) { return { undef: 'h2' }; }
    if(dig_H3 === undefined) { return { undef: 'h3' }; }
    if(dig_H4 === undefined) { return { undef: 'h4' }; }
    if(dig_H5 === undefined) { return { undef: 'h5' }; }
    if(dig_H6 === undefined) { return { undef: 'h6' }; }

    const var1 = Tfine - 76800.0;
    const var2 = (adcH - (
                   dig_H4 * 64.0 + dig_H5 / 16384.0 * var1
                 )) *
                 (dig_H2 / 65536.0 * (
                   1.0 + dig_H6 / 67108864.0 * var1 * (
                     1.0 + dig_H3 / 67108864.0 * var1)
                 ));
    const var3 = var2 * (1.0 - dig_H1 * var2 / 524288.0);
    const h = Math.min(Math.max(var3, 0), 100); // clamp(0, 100)

    // console.log('compH', adcH, Tfine, var3, h);

    return {
      adc: adcH,
      Hunclamped: var3,
      percent: h
    };
  }
}



const enumMap = {
  oversamples: [ //
    { name: false, value: 0 },
    { name: 1,     value: 1 },
    { name: 2,     value: 2 },
    { name: 4,     value: 3 },
    { name: 8,     value: 4 },
    { name: 16,    value: 5 }
  ],
  filters: [ // bmp280 / bme280
    { name: false, value: 0 },
    { name: 2,     value: 1 },
    { name: 4,     value: 2 },
    { name: 8,     value: 3 },
    { name: 16,    value: 4 }
  ],
  filters_more: [ // bme680
    { name: false, value: 0 },
    { name: 1,     value: 1 },
    { name: 3,     value: 2 },
    { name: 7,     value: 3 },
    { name: 15,    value: 4 },
    { name: 31,    value: 5 },
    { name: 63,    value: 6 },
    { name: 127,   value: 7 }
  ],
  modes: [ // bmp280 / bme280
    { name: 'SLEEP',  value: 0 },
    { name: 'FORCED', value: 1 },
    { name: 'NORMAL', value: 3 }
  ],
  modes_sans_normal: [ // bme680
    { name: 'SLEEP',  value: 0 },
    { name: 'FORCED', value: 1 }
  ],
  standbys: [ // bmp280
    { name:  0.5, value: 0 }, //    0.5 ms
    { name: 62.5, value: 1 }, //   62.5
    { name:  125, value: 2 }, //  125
    { name:  250, value: 3 }, //  250
    { name:  500, value: 4 }, //  500
    { name: 1000, value: 5 }, // 1000
    { name: 2000, value: 6 }, // 2000
    { name: 4000, value: 7 }, // 4000
    // alias
    { name: true, value: 7 } // MAX
  ],
  standbys_hires: [ // bme280
    { name:  0.5, value: 0 }, //    0.5 ms
    { name:   10, value: 6 }, //   10
    { name:   20, value: 7 }, //   20
    { name: 62.5, value: 1 }, //   62.5
    { name:  125, value: 2 }, //  125
    { name:  250, value: 3 }, //  250
    { name:  500, value: 4 }, //  500
    { name: 1000, value: 5 }, // 1000
    // alias
    { name: true, value: 5 }  // MAX
  ]
}

//
class genericChip {
  static get features() {
    return {
      pressure: false,
      tempature: false,
      humidity: false,
      gas: false,
      normalMode: false
    }
  }

  static get name() { return 'generic'; }
  static get chip_id() { return undefined; }
  static get skip_value() { return 0x80000; }
  static id(bus) { return Util.readblock(bus, [0xD0]).then(buffer => buffer.readInt8(0)); }
  static reset(bus) { return bus.write(0xE0, 0xB6); }

  // calibrate
  // profile
  // measure
  // ready
  // setProfile


  get ranges() {
    return {
      tempatureC: [0, 60],
      pressurehP: [900, 1100],
      humidityPercent: [20, 80]
    };
  }
}

module.exports.genericChip = genericChip;
module.exports.Compensate = Compensate;
module.exports.enumMap = enumMap;
