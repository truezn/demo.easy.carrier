'use strict';
sap.ui.define(
  [
    'sap/ui/core/util/MockServer',
    'sap/ui/model/json/JSONModel',
    'sap/ui/thirdparty/URI',
    'sap/base/util/UriParameters',
    'sap/base/Log',
  ],
  function (MockServer, JSONModel, URI, UriParameters, Log) {
    var _oMockServer;

    return {
      /**
       * Initializes the mock server.
       * You can configure the delay with the URL parameter "serverDelay".
       * The local mock data in this folder is returned instead of the real data for testing.
       * @public
       */
      init: function () {
        var that = this;
        var oPromise = new Promise(function (resolve, reject) {
          var sManifestUrl = '../manifest.json';
          var oManifestModel = new JSONModel(sManifestUrl);

          oManifestModel.attachRequestCompleted(function () {
            var options = {
              aEntitySetsNames: [
                'ShipmentAdvice',
                'Item',
                'Party',
                'ContactDetail',
                'LocationMaster',
                'LocationDetail',
                'LocationSharing',
              ],
            };

            // data source
            var componentName = oManifestModel.getProperty('/sap.app/id');
            options.componentName = componentName;
            options.baseUrl =
              sap.ui.require.toUrl(componentName.replace(/\./g, '/')) + '/';

            // token service
            // that._initTokenMockServer('csrfService', oManifestModel, options);

            // json service
            // var jsonMockServer = that._initJsonMockServer('restService', oManifestModel, options);

            // odata service
            that._oMockServer = that._initODataMockServer(
              'mainService',
              oManifestModel,
              options
            );
            Log.info('Running the app with mock data');
            resolve(that._oMockServer);
            // resolve(jsonMockServer);
          });
        });
        return oPromise;
      },

      /**
       * @public returns the mockserver of the app, should be used in integration tests
       * @returns {sap.ui.core.util.MockServer}
       */
      getMockServer: function () {
        return _oMockServer;
      },

      _createRequest: function (oJsonFilesUri, sPath, sFilePath) {
        return {
          method: 'GET',
          path: sPath,
          response: function (oXhr) {
            var sItemLocalUri = oJsonFilesUri + sFilePath;
            var xmlHttpRequest = new XMLHttpRequest();
            var oResponseData = '';
            xmlHttpRequest.open('GET', sItemLocalUri, false);
            xmlHttpRequest.send();
            if (xmlHttpRequest.status === 200) {
              oResponseData = JSON.parse(xmlHttpRequest.response);
            }
            oXhr.respondJSON(200, {}, oResponseData);
            return true;
          },
        };
      },

      _addMoreRequests: function (aRequests, oJsonFilesUri) {
        aRequests.push(
          this._createRequest(
            oJsonFilesUri,
            /GetOpenCustomerPOItem(.*)/,
            '/Item.json'
          )
        );
        aRequests.push(
          this._createRequest(
            oJsonFilesUri,
            /TransportModeCodeList(.*)/,
            '/TransportModeCodeList.json'
          )
        );
        aRequests.push(
          this._createRequest(
            oJsonFilesUri,
            /ShipmentTypeCodeList(.*)/,
            '/ShipmentTypeCodeList.json'
          )
        );
        aRequests.push(
          this._createRequest(
            oJsonFilesUri,
            /ExecutionStatusCodeList(.*)/,
            '/ExecutionStatusCodeList.json'
          )
        );
        aRequests.push(
          this._createRequest(
            oJsonFilesUri,
            /DocumentReferenceTypeCodeList(.*)/,
            '/DocumentTypeCodeList.json'
          )
        );
        aRequests.push(
          this._createRequest(
            oJsonFilesUri,
            /TimeZoneCodeList(.*)/,
            '/TimeZoneCodeList.json'
          )
        );

        aRequests.push(
          this._createRequest(
            oJsonFilesUri,
            /ShipmentAdvice(.*)\/Customer(.*)/,
            '/CustomerPerson.json'
          )
        );
        aRequests.push(
          this._createRequest(
            oJsonFilesUri,
            /ShipmentAdvice(.*)\/Carrier(.*)/,
            '/CarrierPerson.json'
          )
        );

        aRequests.push(
          this._createRequest(
            oJsonFilesUri,
            /ShipmentAdvice(.*)\/PlannedDepartureLocation(.*)\/LocationDetail(.*)/,
            '/DepLocationDetail.json'
          )
        );

        aRequests.push(
          this._createRequest(
            oJsonFilesUri,
            /ShipmentAdvice(.*)\/PlannedArrivalLocation(.*)\/LocationDetail(.*)/,
            '/AriLocationDetail.json'
          )
        );

        aRequests.push(
          this._createRequest(
            oJsonFilesUri,
            /LocationMaster(.*)/,
            '/LocationMaster.json'
          )
        );
      },

      _initODataMockServer: function (
        dataSourceName,
        oManifestModel,
        oOptions
      ) {
        var oUriParameters = new UriParameters(window.location.href);

        var sBaseUrl = oOptions.baseUrl;
        var dataSources = oManifestModel.getProperty('/sap.app/dataSources');
        var oDataSource = dataSources[dataSourceName];

        // parse manifest for local metatadata URI
        var _resolveUriRelativeTo = this._resolveUriRelativeTo;
        var sMockServerUrl = _resolveUriRelativeTo(
          oDataSource.uri,
          sBaseUrl
        ).toString(); // "webapp/data/gtt/odata/v1/service"

        // ensure there is a trailing slash
        sMockServerUrl = /.*\/$/.test(sMockServerUrl)
          ? sMockServerUrl
          : sMockServerUrl + '/';

        // create a mock server instance or stop the existing one to reinitialize
        var oMockServer = new MockServer({
          rootUri: sMockServerUrl,
        });

        // configure mock server with the given options or a default delay of 0.5s
        MockServer.config({
          autoRespond: true,
          autoRespondAfter:
            oOptions.delay || oUriParameters.get('serverDelay') || 500,
        });

        // load local mock data
        var oMetadataUri = _resolveUriRelativeTo(
          oDataSource.settings.localUri,
          sBaseUrl
        );
        var oJsonFilesUri = new URI('mockdata').absoluteTo(oMetadataUri);

        // simulate all requests using mock data
        oMockServer.simulate(oMetadataUri.toString(), {
          sMockdataBaseUrl: oJsonFilesUri.toString(),
          bGenerateMissingMockData: true,
          aEntitySetsNames: oOptions.aEntitySetsNames,
        });

        var aRequests = oMockServer.getRequests();

        this._addMoreRequests(aRequests, oJsonFilesUri);

        // compose an error response for each request
        var fnResponse = function (iErrCode, sMessage, aRequest) {
          aRequest.response = function (oXhr) {
            oXhr.respond(
              iErrCode,
              {
                'Content-Type': 'text/plain;charset=utf-8',
              },
              sMessage
            );
          };
        };

        // simulate metadata errors
        if (oOptions.metadataError || oUriParameters.get('metadataError')) {
          aRequests.forEach(function (aEntry) {
            if (aEntry.path.toString().indexOf('$metadata') > -1) {
              fnResponse(500, 'metadata Error', aEntry);
            }
          });
        }

        // simulate request errors
        var sErrorParam = oOptions.errorType || oUriParameters.get('errorType');
        var iErrorCode = sErrorParam === 'badRequest' ? 400 : 500;
        if (sErrorParam) {
          aRequests.forEach(function (aEntry) {
            fnResponse(iErrorCode, sErrorParam, aEntry);
          });
        }

        // custom mock behaviour may be added here

        // set requests and start the server
        oMockServer.setRequests(aRequests);
        oMockServer.start();

        return oMockServer;
      },

      _resolveUriRelativeTo: function (sUri, sBaseUrl) {
        var oUri = new URI(sUri);

        if (oUri.is('absolute') || (oUri.path() && oUri.path()[0] === '/')) {
          return oUri;
        }

        var oPageBase = new URI(document.baseURI).search(''); // "http://localhost:9876/base/"
        var oBaseUri = new URI(sBaseUrl).absoluteTo(oPageBase); // "/base/webapp/" => "http://localhost:9876/base/webapp/"
        var oAbsoluteUri = oUri.absoluteTo(oBaseUri); // "data/gtt/odata/v1/service" => "http://localhost:9876/base/webapp/data/gtt/odata/v1/service"

        return oAbsoluteUri.relativeTo(oPageBase); // "webapp/data/gtt/odata/v1/service"
      },
    };
  }
);
