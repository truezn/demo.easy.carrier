'use strict';
sap.ui.define(
  ['sap/ui/core/mvc/Controller', '../utils/Formatter'],
  function (Controller, Formatter) {
    return Controller.extend('demo.easy.carrier.controller.BaseController', {
      _oWnerComponent: null,
      _sComponentName: null,
      formatter: Formatter,

      onInit: function () {
        this._initControls();
        this._initModel();
        this._initRoute();
      },

      _initControls: function () {
        // This is intentional
      },

      _initModel: function () {
        // This is intentional
      },

      _initRoute: function () {
        // This is intentional
      },

      onBeforeRendering: function () {
        // This is intentional
      },

      onAfterRendering: function () {
        // This is intentional
      },

      onExit: function () {
        // This is intentional
      },

      getComponent: function () {
        return (this._oWnerComponent = this.getOwnerComponent());
      },

      getComponentData: function () {
        return this.getOwnerComponent().getComponentData();
      },

      getModel: function (sModelName) {
        return this.getOwnerComponent().getModel(sModelName);
      },

      getRouter: function () {
        return this.getOwnerComponent().getRouter();
      },

      getResourceBundle: function () {
        return this.getOwnerComponent().getModel('i18n').getResourceBundle();
      },

      getServiceUri: function (sServiceName) {
        return this.getComponent().getManifestEntry('sap.app').dataSources[
          sServiceName
        ].uri;
      },

      getComponentName: function () {
        return (this._sComponentName = this.getComponent().getComponentName());
      },
    });
  }
);
