'use strict';
sap.ui.define([], function () {
  var oCustomFilter = {
    FilterName: {
      PurchaseOrderNo: 'PurchaseOrderNo',
      Status: 'Status',
      TransportationModeCode: 'TransportationModeCode',
      PlannedDepartureBizTimeZone: 'PlannedDepartureBizTimeZone',
      PlannedArrivalBizTimeZone: 'PlannedArrivalBizTimeZone',
    },
    FilterPath: {
      PlannedDepartureBizTimeZone: 'PlannedDepartureBizTimeZone',
      PlannedArrivalBizTimeZone: 'PlannedArrivalBizTimeZone',
      PurchaseOrderNo: 'CustomerPOItems/PurchaseOrderNo',
      Status: 'Status',
      TransportationModeCode: 'TransportationMode_Code',
    },
  };

  return oCustomFilter;
});
