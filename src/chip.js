
/**
 * Chip/Chips
 */
class Chip {
  static fromId(id){
    if(id === bmp280Chip.CHIP_ID){ return bmp280Chip; }
    else if(id === bme280Chip.CHIP_ID){ return bme280Chip; }
    return UnknownChip;
  }
}

const UnknownChip = {
  name: 'Unknown',
  REG_ID:          0xD0,

  supportsPressure: false,
  supportsTempature: false,
  supportsHumidity: false
};

const bme280Chip = {
  name: 'bme280',
  supportsPressure: true,
  supportsTempature: true,
  supportsHumidity: true,

  CHIP_ID: 0x60,
  RESET_MAGIC: 0xB6,
  SKIPPED_SAMPLE_VALUE: 0x80000,

  MODE_SLEEP: 0b00,
  MODE_FORCED: 0b01, // alts 01 10
  MODE_NORMAL: 0b11,

  REG_CALIBRATION: 0x88,
  REG_ID:          0xD0,
  REG_VERSION:     0xD1,
  REG_RESET:       0xE0,
  REG_CTRL_HUM:    0xF2, // bme280 
  REG_STATUS:      0xF3,
  REG_CTRL:        0xF4, // REG_CTRL_MEAS
  REG_CONFIG:      0xF5,
  REG_PRESS:       0xF7,
  REG_TEMP:        0xFA,
  REG_HUM:         0xFD,

  // https://github.com/drotek/BMP280/blob/master/Software/BMP280/BMP280.h
  REG_CAL26: 0xE1,  // R calibration stored in 0xE1-0xF0

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
};

const bmp280Chip = {
  name: 'bmp280',
  supportsPressure: true,
  supportsTempature: true,
  supportsHumidity: false,

  CHIP_ID: 0x58, // some suggest 0x56 and 0x57
  RESET_MAGIC: 0xB6,
  SKIPPED_SAMPLE_VALUE: 0x80000,

  MODE_SLEEP: 0b00,
  MODE_FORCED: 0b01, // alts 01 10
  MODE_NORMAL: 0b11,

  REG_CALIBRATION: 0x88,
  REG_ID:          0xD0,
  REG_VERSION:     0xD1,
  REG_RESET:       0xE0,
  REG_STATUS:      0xF3,
  REG_CTRL:        0xF4,
  REG_CONFIG:      0xF5,
  REG_PRESS:       0xF7,
  REG_TEMP:        0xFA,

  // https://github.com/drotek/BMP280/blob/master/Software/BMP280/BMP280.h
  REG_CAL26: 0xE1,  // R calibration stored in 0xE1-0xF0

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

};


const Profiles = {
  bmp280: {
    // Sleep
    SLEEP: {
      mode: this.MODE_SLEEP,
      oversampling_p: this.OVERSAMPLE_SKIP,
      oversampling_t: this.OVERSAMPLE_SKIP, 
      filter_coefficient: this.COEFFICIENT_OFF,
      standby_time: this.STANDBY_4000
    },

    // randoms
    TEMPATURE_ONLY: {
      mode: this.MODE_NORMAL,
      oversampling_p: this.OVERSAMPLE_OFF,
      oversampling_t: this.OVERSAMPLE_X16,
      filter_coefficient: this.COEFFICIENT_OFF,
      standby_time: this.STANDBY_05
    },
    TEMPATURE_MOSTLY: {
      mode: this.MODE_NORMAL,
      oversampling_p: this.OVERSAMPLE_X1,
      oversampling_t: this.OVERSAMPLE_X16,
      filter_coefficient: this.COEFFICIENT_2,
      standby_time: this.STANDBY_05
    },
    SLOW_TEMPATURE_MOSTLY: {
      mode: this.MODE_NORMAL,
      oversampling_p: this.OVERSAMPLE_X1,
      oversampling_t: this.OVERSAMPLE_X16,
      filter_coefficient: this.COEFFICIENT_2,
      standby_time: this.STANDBY_1000
    },
    MAX_STANDBY: {
      mode: bmp280Chip.MODE_NORMAL,
      oversampling_p: bmp280Chip.OVERSAMPLE_X1,
      oversampling_t: bmp280Chip.OVERSAMPLE_X1,
      filter_coefficient: bmp280Chip.COEFFICIENT_OFF,
      standby_time: bmp280Chip.STANDBY_4000
    },

    // from the spec
    HANDHELD_DEVICE_LOW_POWER: {
      mode: this.MODE_NORMAL,
      oversampling_p: this.OVERSAMPLE_X16,
      oversampling_t: this.OVERSAMPLE_X2,
      filter_coefficient: 4,
      standby_time: this.STANDBY_62
    },
    HANDHELD_DEVICE_DYNAMIC: {
      mode: this.MODE_NORMAL,
      oversampling_p: this.OVERSAMPLE_X4,
      oversampling_t: this.OVERSAMPLE_X1,
      filter_coefficient: 16,
      standby_time: this.STANDBY_05
    },
    WEATHER_MONITORING: {
      mode: this.MODE_FORCED,
      oversampling_p: this.OVERSAMPLE_X1,
      oversampling_t: this.OVERSAMPLE_X1,
      filter_coefficient: 0,
      standby_time: this.STANDBY_1
    },
    ELEVATOR_FLOOR_CHAHGE: {
      mode: this.MODE_NORMAL,
      oversampling_p: this.OVERSAMPLE_X4,
      oversampling_t: this.OVERSAMPLE_X1,
      filter_coefficient: 4,
      standby_time: this.STANDBY_125
    },
    DROP_DETECTION: {
      mode: this.MODE_NORMAL,
      oversampling_p: this.OVERSAMPLE_X2,
      oversampling_t: this.OVERSAMPLE_X1,
      filter_coefficient: 0,
      standby_time: this.STANDBY_05
    },
    INDOR_NAVIGATION: {
      mode: this.MODE_NORMAL,
      oversampling_p: this.OVERSAMPLE_X16,
      oversampling_t: this.OVERSAMPLE_X2,
      filter_coefficient: 16,
      standby_time: this.STANDBY_05
    }
  },

  bme280: {
    MAX_STANDBY: {
      mode: bme280Chip.MODE_NORMAL,
      oversampling_p: bme280Chip.OVERSAMPLE_X1,
      oversampling_t: bme280Chip.OVERSAMPLE_X1,
      filter_coefficient: bme280Chip.COEFFICIENT_OFF,
      standby_time: bme280Chip.STANDBY_4000
    }
  }
}


module.exports = {
  chip: Chip,
  chips: {
    unknown: UnknownChip,
    bmp280: bmp280Chip,
    bme280: bme280Chip
  },
  profiles: Profiles
};

