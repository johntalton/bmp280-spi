"use strict";

/**
 * Chip/Chips
 */
class Chip {
  static fromId(id){
    if(id === bmp280Chip.CHIP_ID){ return bmp280Chip; }
    else if(id === bme280Chip.CHIP_ID){ return bme280Chip; }
    else if(id === bme680Chip.CHIP_ID) { return bme680Chip; }
    return UnknownChip;
  }
}

const UnknownChip = {
  name: 'Unknown',
  REG_ID:          0xD0,

  supportsPressure: false,
  supportsTempature: false,
  supportsHumidity: false,
  supportsGas: false,
  supportsNormalMode: false
};

const bme680Chip = {
  name: 'bme680',
  supportsPreassure: true,
  supportsTempature: true,
  supportsHumidity: true,
  supportsGas: true,
  supportsNormalMode: false,

  CHIP_ID: 0x61,
  RESET_MAGIC: 0xB6,
  SKIPPED_SAMPLE_VALUE: 0x80000,

  MODE_SLEEP: 0b00,
  MODE_FORCED: 0b01,
  // normal?

  CALIBRATION_BLOCK: [[0x89, 25], [0x1E, 16], 0x00, 0x02, 0x04],

  REG_STATUS: 0x73,

  REG_RESET:       0xE0,
  REG_ID:          0xD0,
  // version
  REG_CONFIG:      0x75,
  REG_CTRL_MEAS:   0x74, // REG_CTRL
  REG_CTRL_HUM:    0x72,
  REG_CTRL_GAS:    0x70,
  REG_GAS_WAIT_X:  0x64,
  REG_RES_HEAT_X:  0x5A,
  REG_IDAC_HEAT_X: 0x50,
  REG_GAS:         0x2A,
  REG_HUM:         0x25,
  REG_TEMP:        0x22,
  REG_PRES:        0x1F,
  REG_MEAS_STATUS_0: 0x1D,

  OVERSAMPLE_SKIP: 0b000,
  OVERSAMPLE_X1:   0b001,
  OVERSAMPLE_X2:   0b010,
  OVERSAMPLE_X4:   0b011,
  OVERSAMPLE_X8:   0b100,
  OVERSAMPLE_X16:  0b101,

  COEFFICIENT_OFF: 0b000,
  COEFFICIENT_1:   0b001,
  COEFFICIENT_3:   0b010,
  COEFFICIENT_7:   0b011,
  COEFFICIENT_15:  0b100,
  COEFFICIENT_31:  0b101,
  COEFFICIENT_63:  0b110,
  COEFFICIENT_127: 0b111

};

const bme280Chip = {
  name: 'bme280',
  supportsPressure: true,
  supportsTempature: true,
  supportsHumidity: true,
  supportsGas: false,
  supportsNormalMode: true,

  CHIP_ID: 0x60,
  RESET_MAGIC: 0xB6,
  SKIPPED_SAMPLE_VALUE: 0x80000,

  MODE_SLEEP: 0b00,
  MODE_FORCED: 0b01, // alts 01 10
  MODE_NORMAL: 0b11,

  REG_ID:          0xD0,
  // REG_VERSION:     0xD1,
  REG_RESET:       0xE0,
  REG_CTRL_HUM:    0xF2, // bme280
  REG_STATUS:      0xF3,
  REG_CTRL_MEAS:   0xF4,
  REG_CONFIG:      0xF5,
  REG_PRESS:       0xF7,
  REG_TEMP:        0xFA,
  REG_HUM:         0xFD,

  CALIBRATION_BLOCK: [[0x88, 24], 0xA1, [0xE1, 7]],

  OVERSAMPLE_SKIP: 0b000,
  OVERSAMPLE_X1:   0b001,
  OVERSAMPLE_X2:   0b010,
  OVERSAMPLE_X4:   0b011,
  OVERSAMPLE_X8:   0b100,
  OVERSAMPLE_X16:  0b101, // t-alts 101 110 111, p-alts 101, Others <-- thanks docs

  COEFFICIENT_OFF: 0b000,
  COEFFICIENT_2:   0b001,
  COEFFICIENT_4:   0b010,
  COEFFICIENT_8:   0b011,
  COEFFICIENT_16:  0b100,

  // bme280
  STANDBY_05:   0b000, //     0.5 ms
  STANDBY_10:   0b110, //    10
  STANDBY_20:   0b111, //    20
  STANDBY_62:   0b001, //    62.5
  STANDBY_125:  0b010, //   125
  STANDBY_250:  0b011, //   250
  STANDBY_500:  0b100, //   500
  STANDBY_1000: 0b101, //  1000

  STANDBY_MIN: 0b000, // STANDBY_05 alias
  STANDBY_MAX: 0b101 // STANDBY_1000 alias
};

const bmp280Chip = {
  name: 'bmp280',
  supportsPressure: true,
  supportsTempature: true,
  supportsHumidity: false,
  supportsGas: false,
  supportsNormalMode: true,

  CHIP_ID: 0x58, // some suggest 0x56 and 0x57
  RESET_MAGIC: 0xB6,
  SKIPPED_SAMPLE_VALUE: 0x80000,

  MODE_SLEEP: 0b00,
  MODE_FORCED: 0b01, // alts 01 10
  MODE_NORMAL: 0b11,

  REG_ID:          0xD0,
  REG_VERSION:     0xD1,
  REG_RESET:       0xE0,
  REG_STATUS:      0xF3,
  REG_CTRL_MEAS:   0xF4,
  REG_CONFIG:      0xF5,
  REG_PRESS:       0xF7,
  REG_TEMP:        0xFA,

  CALIBRATION_BLOCK: [[0x88, 24]],

  OVERSAMPLE_SKIP: 0b000,
  OVERSAMPLE_X1:   0b001,
  OVERSAMPLE_X2:   0b010,
  OVERSAMPLE_X4:   0b011,
  OVERSAMPLE_X8:   0b100,
  OVERSAMPLE_X16:  0b101, // t-alts 101 110 111, p-alts 101, Others <-- thanks docs

  COEFFICIENT_OFF: 0b000,
  COEFFICIENT_2:   0b001,
  COEFFICIENT_4:   0b010,
  COEFFICIENT_8:   0b011,
  COEFFICIENT_16:  0b100,

  STANDBY_05:   0b000, //    0.5 ms
  STANDBY_62:   0b001, //   62.5
  STANDBY_125:  0b010, //  125
  STANDBY_250:  0b011, //  250
  STANDBY_500:  0b100, //  500
  STANDBY_1000: 0b101, // 1000
  STANDBY_2000: 0b110, // 2000
  STANDBY_4000: 0b111, // 4000

  STANDBY_MIN: 0b000, // STANDBY_05 alias
  STANDBY_MAX: 0b111 // STANDBY_4000 alias
};

module.exports = {
  chip: Chip,
  chips: {
    unknown: UnknownChip,
    bmp280: bmp280Chip,
    bme280: bme280Chip,
    bme680: bme680Chip
  }
};

