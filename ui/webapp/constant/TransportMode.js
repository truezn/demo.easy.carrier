'use strict';
sap.ui.define([], function () {
  /**
   * Enum type for the transport mode
   * @enum {string}
   * @public
   */
  var TransportMode = {
    Ocean: {
      key: '01',
      shipmentType: {
        FCL: '3',
        LCL: '2',
      },
    },
    Air: {
      key: '04',
    },
    Truck: {
      key: '03',
      shipmentType: {
        FCL: '18',
        LCL: '17',
      },
    },
    Parcel: {
      key: '05',
      shipmentType: {
        PACL: '20',
      },
    },
  };

  return TransportMode;
});
