'use strict';
sap.ui.define(
  [
    './BaseController',
    '../utils/ErrorHandler',
    '../constant/CustomFilter',
    '../constant/ViewMode',
    '../constant/StatusCode',
    'sap/ui/model/json/JSONModel',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/model/Sorter',
    'sap/ui/core/Fragment',
    'sap/ui/model/type/String',
  ],
  /**
   * @param {typeof sap.ui.core.mvc.Controller} BaseController
   */
  function (
    BaseController,
    ErrorHandler,
    CustomFilter,
    ViewMode,
    StatusCode,
    JSONModel,
    Filter,
    FilterOperator,
    Sorter,
    Fragment,
    TypeString
  ) {
    return BaseController.extend(
      'demo.easy.carrier.controller.ShipmentOrderList',
      {
        _aSelectedRowsContexts: [],
        _oBaseController: BaseController,
        _oConstants: {
          SELECTED_STATUS_KEYS: 'selectedStatusKeys',
          SELECTED_TRANSPORT_MODE_KEYS: 'selectedTransportModeKeys',
          CUSTOM_FILT_OP_EMPTY: 'Empty',
        },

        _setCustomFilter: function (sKey, sPropertyValue) {
          var sPropertyName = this._getPropertyName(sKey);
          if (sPropertyValue.keys) {
            this._oViewModel.setProperty(
              sPropertyName,
              JSON.parse(sPropertyValue.keys)
            );
          } else {
            this._oViewModel.setProperty(sPropertyName, []);
          }
        },

        _getPropertyName: function (key) {
          var sPropertyName = '';
          switch (key) {
            case CustomFilter.FilterName.Status:
              sPropertyName = this._oConstants.SELECTED_STATUS_KEYS;
              break;
            case CustomFilter.FilterName.TransportationModeCode:
              sPropertyName = this._oConstants.SELECTED_TRANSPORT_MODE_KEYS;
              break;
            default:
              break;
          }
          return sPropertyName;
        },

        onNavToDetailPressed: function (oEvent) {
          var oSource = oEvent.getSource();
          var oBindingContext = oSource.getBindingContext();
          var sPath = oBindingContext.getPath();
          var oDataModel = this.getModel();
          var oBindingData = oDataModel.getData(sPath);
          var oNavPara = {
            para: {
              Id: oBindingData.Id,
            },
          };
          this._NavTo('shipmentDisDetail', oNavPara);
        },

        // To set custom binding parameter before smart table odata call
        onBeforeRebindTable: function (oEvent) {
          let oBindingParams = oEvent.getParameter('bindingParams');
          let aFilterItemsWithValues =
            this._oSmartFilterBar.getFiltersWithValues();
          const fnHandleCustomFilter = function (item) {
            var sName = item.getName();
            if (
              Object.prototype.hasOwnProperty.call(
                CustomFilter.FilterName,
                sName
              )
            ) {
              this._addCustomFilters(oBindingParams.filters, item);
            }
          };
          const fnHandlerDataReceived = function () {
            if (
              this._oListPlaceHolder &&
              this._oListPlaceHolder.hidePlaceholder
            ) {
              this._oListPlaceHolder.hidePlaceholder();
            }
          };
          if (aFilterItemsWithValues.length > 0) {
            aFilterItemsWithValues.forEach(fnHandleCustomFilter.bind(this));
          }
          let aSorter = [new Sorter('createdAt', true)];
          oBindingParams.sorter = aSorter;
          oBindingParams.parameters.expand =
            'ShipmentType,TransportationMode,PlannedDepartureLocation/LocationDetail,PlannedArrivalLocation/LocationDetail,Customer,Carrier,CustomerPOItems';
          oBindingParams.events.dataReceived = fnHandlerDataReceived.bind(this);
        },

        // -------------------Smart Variant management handler-----------------------
        onAfterVariantLoad: function (oEvent) {
          var oFilterData = this._oSmartFilterBar.getFilterData();
          var oCustomData = oFilterData._CUSTOM;
          var fnHandleCustomFilter = function (key) {
            this._setCustomFilter(key, oCustomData[key]);
          };
          for (var prop in CustomFilter.FilterName) {
            if (
              Object.prototype.hasOwnProperty.call(
                CustomFilter.FilterName,
                prop
              )
            ) {
              fnHandleCustomFilter(CustomFilter.FilterName.prop);
            }
          }
          this._oSmartFilterBar.search();
        },

        onBeforeVariantFetch: function () {
          this._updateCustomFilter();
        },

        _updateCustomFilter: function () {
          var oCustomData = {
            Status: {
              keys: this._getPropertyVal(CustomFilter.FilterName.Status),
            },
            TransportationModeCode: {
              keys: this._getPropertyVal(
                CustomFilter.FilterName.TransportationModeCode
              ),
            },
          };

          this._oSmartFilterBar.setFilterData({
            _CUSTOM: oCustomData,
          });
        },

        _getPropertyVal: function (key) {
          return JSON.stringify(
            this._oViewModel.getProperty(this._getPropertyName(key))
          );
        },

        onEditBtnPressed: function (oEvent) {
          var oSelectItem = null;
          var sBindingPath = '';
          var oBindingData = null;

          oSelectItem = this.byId('table').getSelectedItem();
          sBindingPath = oSelectItem.getBindingContextPath();
          oBindingData = this._oDataModel.getProperty(sBindingPath);
          var oNavPara = {
            para: {
              Id: oBindingData.Id,
              mode: ViewMode.Edit,
            },
          };
          this._NavTo('shipmentEdtDetail', oNavPara);
        },

        onAddBtnPressed: function (oEvent) {
          var oNavPara = {
            para: {
              mode: ViewMode.Create,
            },
          };
          this._NavTo('shipmentCrtDetail', oNavPara);
        },

        // -----------------Private methods-----------------------------------------
        // Navigate to detail pages
        _NavTo: function (sTarget, oPara) {
          var oRouter = this.getRouter();
          // To navigate display detail page or create detail page
          oRouter.navTo(sTarget, oPara);
        },

        // add Custom filter value
        _addCustomFilters: function (aFilters, oCustomFilterItem) {
          var oCustomFilterControl = oCustomFilterItem.getControl();
          var sName = oCustomFilterItem.getName();

          switch (sName) {
            case CustomFilter.FilterName.PurchaseOrderNo:
              this._convertPurchaseNoFilter(
                oCustomFilterControl,
                aFilters,
                CustomFilter.FilterPath
              );
              break;
            case CustomFilter.FilterName.Status:
            case CustomFilter.FilterName.TransportationModeCode:
              this._convertStatusAndTransModeFilter(
                oCustomFilterControl,
                aFilters,
                CustomFilter.FilterPath,
                sName
              );
              break;
            default:
              break;
          }
        },
        _convertStatusAndTransModeFilter: function (
          oCustomControl,
          aFilters,
          oPath,
          sName
        ) {
          var aSelectedKeys = oCustomControl.getProperty('selectedKeys');
          if (Array.isArray(aSelectedKeys)) {
            aSelectedKeys.forEach(function (value, index) {
              aFilters.push(
                new Filter({
                  path: oPath[sName],
                  operator: FilterOperator.EQ,
                  value1: value,
                })
              );
            });
          }
        },
        _handleExclueFilter: function (aFilters, oProperty, oPath) {
          switch (oProperty.range.operation) {
            case FilterOperator.EQ:
              aFilters.push(
                new Filter({
                  path: oPath[oProperty.range.keyField],
                  operator: FilterOperator.NE,
                  value1: oProperty.range.value1,
                })
              );
              break;
            case this._oConstants.CUSTOM_FILT_OP_EMPTY:
              aFilters.push(
                new Filter({
                  filters: [
                    new Filter({
                      path: oPath[oProperty.range.keyField],
                      operator: FilterOperator.NE,
                      value1: '',
                    }),
                    new Filter({
                      path: oPath[oProperty.range.keyField],
                      operator: FilterOperator.NE,
                      value1: null,
                    }),
                  ],
                  and: true,
                })
              );
              break;
            default:
              break;
          }
        },

        _handleIncludeFilter: function (aFilters, oProperty, oPath) {
          if (
            oProperty.range.operation === this._oConstants.CUSTOM_FILT_OP_EMPTY
          ) {
            aFilters.push(
              new Filter({
                filters: [
                  new Filter({
                    path: oPath[oProperty.range.keyField],
                    operator: FilterOperator.EQ,
                    value1: '',
                  }),
                  new Filter({
                    path: oPath[oProperty.range.keyField],
                    operator: FilterOperator.EQ,
                    value1: null,
                  }),
                ],
              })
            );
          } else {
            aFilters.push(
              new Filter({
                path: oPath[oProperty.range.keyField],
                operator: oProperty.range.operation,
                value1: oProperty.range.value1,
                value2: oProperty.range.value2,
              })
            );
          }
        },

        _convertPurchaseNoFilter: function (oCustomControl, aFilters, oPath) {
          var aTokens = oCustomControl.getTokens();
          if (Array.isArray(aTokens) && aTokens.length > 0) {
            aTokens.forEach(function (oToken) {
              var oProperty = oToken.data();
              if (oProperty.range.exclude) {
                this._handleExclueFilter(aFilters, oProperty, oPath);
              } else {
                this._handleIncludeFilter(aFilters, oProperty, oPath);
              }
            }, this);
          }
        },

        _initControls: function () {
          this._oView = this.getView();
          this._oSmartVariant = this.getView().byId('pageSmartVariant');
          this._oBaseController = BaseController;
          this._oSmartFilterBar = this.getView().byId(
            'shipmentAdviceListFilterBar'
          );
          this._oSmartTable = this.getView().byId('shipmentListsSmartTable');
          this._oRouter = this.getRouter();
        },

        _initModel: function () {
          this._oDataModel = this.getModel();
          this._oDataModel.attachBatchRequestFailed(
            ErrorHandler.handleODataBatchReqError
          );
          this._oViewModel = new JSONModel();
          this._oQuickViewModel = new JSONModel();
          this._oPOItemsPopModel = new JSONModel();
          this._oView.setModel(this._oViewModel, 'view');
        },

        _initRoute: function () {
          this._oRouter.attachRouteMatched(this.onRouterMatched, this);
        },

        onRouterMatched: function (oEvent) {
          let sViewName = oEvent.getParameter('name');
          if (sViewName === 'shipmentList') {
            this._oListPlaceHolder = oEvent.getParameter('targetControl');
            this._handleRouteMatched();
          }
        },

        _handleRouteMatched: function () {
          if (this._oSmartTable) {
            this._oSmartTable.rebindTable(true);
          }
          this._initDefaultValue();
          this.prepareCodeLists();
        },

        _initDefaultValue: function () {
          this.byId('addBtn').setEnabled(true);
          this.byId('editBtn').setEnabled(false);
          this.byId('copyBtn').setEnabled(false);
        },

        onSelectionChange: function (oEvent) {
          const oTable = oEvent.getSource();
          const aSelectedItems = oTable.getSelectedItems();

          let bItemSelected = aSelectedItems.length === 1;
          this.byId('addBtn').setEnabled(!bItemSelected);
          this.byId('editBtn').setEnabled(bItemSelected);
          if (bItemSelected) {
            if (
              this._oDataModel.getData(
                aSelectedItems[0].getBindingContextPath()
              ).Status === StatusCode.Completed.key
            ) {
              this.byId('editBtn').setEnabled(!bItemSelected);
            }
          }
        },

        onCusPoNoOkPress: function (oEvent) {
          var aTokens = oEvent.getParameter('tokens');
          this._oCusPoItemsInput.setTokens(aTokens);
          this._oCusPoItemDialog.close();
        },
        onCusPoNoCancelPress: function () {
          this._oCusPoItemDialog.close();
        },
        onCusPOItemsRequested: function (oEvent) {
          this._oCusPoItemsInput = oEvent.getSource();
          var sFragmentName =
            'sap.lbn.shipment.advice.view.fragments.CusPoItemsValueHelp';
          if (this._oCusPoItemDialog) {
            this._oCusPoItemDialog.open();
          } else {
            Fragment.load({
              id: 'CusPoItemsDialog',
              name: sFragmentName,
              controller: this,
            }).then(
              function (oCusPoItemsDialog) {
                this._oCusPoItemDialog = oCusPoItemsDialog;
                this._oView.addDependent(oCusPoItemsDialog);
                this._oCusPoItemDialog.setRangeKeyFields([
                  {
                    key: 'PurchaseOrderNo',
                    type: 'string',
                    typeInstance: new TypeString(
                      {},
                      {
                        maxLength: 35,
                      }
                    ),
                  },
                ]);

                this._oCusPoItemDialog.setTokens(
                  this._oCusPoItemsInput.getTokens()
                );
                this._oCusPoItemDialog.open();
              }.bind(this)
            );
          }
        },
      }
    );
  }
);
