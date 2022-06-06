'use strict';
sap.ui.define(
  [
    'sap/base/strings/formatMessage',
    '../constant/StatusCode',
    '../constant/TransportMode',
    '../constant/ViewMode',
  ],
  function (formatMessage, StatusCode, TransportMode, ViewMode) {
    return {
      keyToText: function (iStatusCode) {
        var statusCodeStirng = '';
        var oStatus = this.getModel('global').getProperty(
          '/ExecutionStatusCodeList'
        );
        if (iStatusCode && oStatus instanceof Map && oStatus.size > 0) {
          statusCodeStirng = iStatusCode.toString();
          return oStatus.get(statusCodeStirng);
        }
      },
      keyToIcon: function (iStatusCode) {
        var icon = '';
        switch (iStatusCode) {
          case StatusCode.NotStarted.key:
            icon = 'sap-icon://status-inactive';
            break;
          case StatusCode.InTransit.key:
            icon = 'sap-icon://status-in-process';
            break;
          case StatusCode.Completed.key:
            icon = 'sap-icon://status-positive';
            break;
          default:
            break;
        }
        return icon;
      },
      keyToState: function (iStatusCode) {
        var state = null;
        switch (iStatusCode) {
          case StatusCode.NotStarted.key:
            state = sap.ui.core.ValueState.None;
            break;
          case StatusCode.InTransit.key:
            state = sap.ui.core.ValueState.Information;
            break;
          case StatusCode.Completed.key:
            state = sap.ui.core.ValueState.Success;
            break;
          default:
            break;
        }
        return state;
      },
      convertToAdvNum: function (shipementId, shipmentSubId) {
        return formatMessage('{0}-{1}', shipementId, shipmentSubId);
      },
      formateVisibility: function (oTimeStamp) {
        if (oTimeStamp) {
          return true;
        }
        return false;
      },
      convertTransportMode: function (sTranportCode) {
        var sIconText = null;
        switch (sTranportCode) {
          case TransportMode.Truck.key:
            sIconText = 'sap-icon://shipping-status';
            break;
          case TransportMode.Air.key:
            sIconText = 'sap-icon://flight';
            break;
          case TransportMode.Ocean.key:
            sIconText = 'sap-icon://BusinessSuiteInAppSymbols/icon-ship';
            break;
          case TransportMode.Parcel.key:
            sIconText = 'sap-icon://BusinessSuiteInAppSymbols/icon-products';
            break;
          default:
            break;
        }
        return sIconText;
      },
      isTitleClickable: function (sTitle) {
        return sTitle !== undefined;
      },

      convertToTransportName: function (sTransportModeCode) {
        var oTransportMode = this.getModel('global').getProperty(
          '/TransportModeCodeList'
        );
        if (
          sTransportModeCode &&
          oTransportMode instanceof Map &&
          oTransportMode.size > 0
        ) {
          return oTransportMode.get(sTransportModeCode);
        }
      },

      convertShipmentType: function (sShipmentTypeCode) {
        // LTL('17'), FTL('18'), LCL('2'), FCL('3')
        var oShipmentType = this.getModel('global').getProperty(
          '/ShipmentTypeCodeList'
        );
        if (
          sShipmentTypeCode &&
          oShipmentType instanceof Map &&
          oShipmentType.size > 0
        ) {
          return oShipmentType.get(sShipmentTypeCode);
        }
      },
      convertLocation: function (sLocationName, sExternalId) {
        if (sLocationName && sExternalId) {
          return formatMessage('{0} ({1})', [sLocationName, sExternalId]);
        }
        return sExternalId;
      },
      convertCustomerPoItems: function (aCustomerPoItems) {
        var oDataModel = this.getModel();
        var sPath = '';
        var sPONumber = '';
        var sSubItem = '';
        var sText = '';
        var oResourceBundle = this.getResourceBundle();
        if (!Array.isArray(aCustomerPoItems)) {
          return '';
        }
        var sLength = aCustomerPoItems.length;
        if (sLength === 1) {
          sPath = '/' + aCustomerPoItems[0];
          sPONumber = oDataModel.getProperty(sPath + '/PurchaseOrderNo');
          sSubItem = oDataModel.getProperty(sPath + '/ItemNo');
          sText = sPONumber + '/' + sSubItem;
        } else if (sLength > 1) {
          sText = sLength + ' ' + oResourceBundle.getText('items');
        }
        return sText;
      },

      convertTypeCodeName: function (sReferenceTypeCode, sName) {
        if (sReferenceTypeCode && sName) {
          return formatMessage('{0} ({1})', [sName, sReferenceTypeCode]);
        }
        return '';
      },

      isClickable: function (object) {
        if (object && object.length > 1) {
          return true;
        }
        return false;
      },

      convertCrtEdtPageTitle: function (sMode) {
        var oResourceBundle = this.getResourceBundle();
        var sPageTitle = '';
        switch (sMode) {
          case ViewMode.Create:
            sPageTitle = oResourceBundle.getText('detailCrtPageTitle');
            break;
          case ViewMode.Edit:
            sPageTitle = oResourceBundle.getText('detailEdtPageTitle');
            break;
          default:
            break;
        }
        return sPageTitle;
      },

      convertCusShpAdcNo: function (sLbnId, sBpName) {
        if (sBpName) {
          return sBpName;
        }
        return sLbnId;
      },

      convertPartyInfo: function (sLbnId, sBpName) {
        if (sBpName) {
          return sBpName;
        }
        return sLbnId;
      },

      convertPartyInfoViaInput: function (sLbnId, sBpName) {
        if (sLbnId && sBpName) {
          return formatMessage('{0} ({1})', [sBpName, sLbnId]);
        }
        return sLbnId;
      },

      convertToLocalTZ: function (oDate, sTimezone) {
        if (oDate && sTimezone) {
          var sUTCTime = oDate.getTime();
          var oDateFormate = sap.ui.core.format.DateFormat.getDateTimeInstance({
            style: 'medium',
          });
          var sDateString = new Date(sUTCTime).toLocaleString('en-US', {
            timeZone: sTimezone,
          });
          return formatMessage('{0}, {1}', [
            oDateFormate.format(new Date(sDateString)),
            sTimezone,
          ]);
        }
      },

      validateCustomer: function (CustomerLbnId) {
        if (!CustomerLbnId) {
          return false;
        }
        return true;
      },

      validateCustomerPoItems: function (aCustomer) {
        if (aCustomer && Array.isArray(aCustomer) && aCustomer.length > 0) {
          return true;
        }
        return false;
      },

      validateDetailStep: function (
        sCarrierLbnId,
        sDepLoca,
        sDepTime,
        sAriLoca,
        sAriTime,
        sDetailStepValid,
        sDepTimeZone,
        sAriTimeZone,
        sPlannedDepLocationId,
        sPlannedArrLocationId
      ) {
        if (
          sCarrierLbnId &&
          sDepLoca &&
          sDepTime &&
          sAriLoca &&
          sAriTime &&
          sDepTimeZone &&
          sAriTimeZone &&
          sDetailStepValid &&
          sPlannedDepLocationId &&
          sPlannedArrLocationId
        ) {
          return true;
        }
        return false;
      },
    };
  }
);
