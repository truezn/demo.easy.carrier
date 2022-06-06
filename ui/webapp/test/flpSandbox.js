'use strict';
sap.ui.define(
  ['sap/base/util/ObjectPath', 'sap/ushell/services/Container'],
  function (ObjectPath) {
    // define ushell config
    ObjectPath.set(['sap-ushell-config'], {
      defaultRenderer: 'fiori2',
      bootstrapPlugins: {
        RuntimeAuthoringPlugin: {
          component: 'sap.ushell.plugins.rta',
          config: {
            validateAppVersion: false,
          },
        },
        PersonalizePlugin: {
          component: 'sap.ushell.plugins.rta-personalize',
          config: {
            validateAppVersion: false,
          },
        },
      },
      renderers: {
        fiori2: {
          componentData: {
            config: {
              enableSearch: false,
              rootIntent: 'Shell-home',
            },
          },
        },
      },
      services: {
        LaunchPage: {
          adapter: {
            config: {
              groups: [
                {
                  tiles: [
                    {
                      tileType: 'sap.ushell.ui.tile.StaticTile',
                      properties: {
                        title: 'Easy Carrier',
                        subtitle: 'Easy Carrier',
                        icon: 'sap-icon://document',
                        targetURL: '#Display-carrier',
                      },
                    },
                  ],
                },
              ],
            },
          },
        },
        ClientSideTargetResolution: {
          adapter: {
            config: {
              inbounds: {
                'Display-carrier': {
                  semanticObject: 'Display',
                  action: 'carrier',
                  signature: {
                    parameters: {},
                    additionalParameters: 'allowed',
                  },
                  resolutionResult: {
                    applicationType: 'SAPUI5',
                    additionalInformation: 'SAPUI5.Component=demo.easy.carrier',
                    url: sap.ui.require.toUrl('demo/easy/carrier'),
                  },
                },
              },
            },
          },
        },
        NavTargetResolution: {
          config: {
            enableClientSideTargetResolution: true,
          },
        },
      },
    });

    var oFlpSandbox = {
      /**
       * Initializes the FLP sandbox
       * @returns {Promise} a promise that is resolved when the sandbox bootstrap has finshed
       */
      init: function () {
        // sandbox is a singleton, so we can start it only once
        if (!this._oBootstrapFinished) {
          this._oBootstrapFinished = sap.ushell.bootstrap('local');
          this._oBootstrapFinished.then(function () {
            sap.ushell.Container.createRenderer().placeAt('content');
          });
        }

        return this._oBootstrapFinished;
      },
    };

    return oFlpSandbox;
  }
);
