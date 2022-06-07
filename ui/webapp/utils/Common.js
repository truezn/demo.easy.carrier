'use strict';
sap.ui.define([], () => {
  const oCommonController = {
    getCodeLists: (oDataModel, sPath) => {
      return new Promise((resolve, reject) => {
        const fnSuccess = (oData) => {
          resolve(oData);
        };
        const fnError = function (oError) {
          reject(oError);
        };
        const oParameter = {
          success: fnSuccess.bind(this),
          error: fnError.bind(this),
        };
        oDataModel.read(sPath, oParameter);
      });
    },
    getValidErrorJSONParse: function (oResponse) {
      if (oResponse) {
        try {
          let oResponseValue = JSON.parse(oResponse);
          if (
            oResponseValue &&
            oResponseValue.error &&
            oResponseValue.error.message &&
            oResponseValue.error.message.value
          ) {
            return oResponseValue.error.message.value;
          }
        } catch (error) {
          return oResponse;
        }
      }
    },
  };
  return oCommonController;
});
