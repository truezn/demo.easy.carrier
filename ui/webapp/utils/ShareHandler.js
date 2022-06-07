'use strict';
sap.ui.define(
  [
    'sap/ui/core/Fragment',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/model/Sorter',
    'sap/ui/model/json/JSONModel',
    'sap/base/strings/formatMessage',
    'sap/m/SearchField',
    'sap/m/ColumnListItem',
    'sap/ui/table/Row',
    'sap/m/Label',
    'sap/m/MessageBox',
    '../constant/CommonConsts',
    '../constant/QuickViewMock',
    '../constant/ViewMode',
    './Common',
  ],
  function (
    Fragment,
    Filter,
    FilterOperator,
    Sorter,
    JSONModel,
    formatMessage,
    SearchField,
    ColumnListItem,
    Row,
    Label,
    MessageBox,
    CommonConsts,
    QuickViewMock,
    ViewMode,
    Common
  ) {
    var oHandler = {
      onLinkClicked: function (oEvent, oController) {
        let oSource = oEvent.getSource();
        let sId = oSource.getId();
        this._initQuickViewData(sId, oController);
        this._openContactQuickView(
          oSource,
          oController._oQuickViewModel,
          oController
        );
      },

      _initQuickViewData: function (sId, oController) {
        if (sId.includes('customer') || sId.includes('carrier')) {
          QuickViewMock.initQuckMockData(oController.getResourceBundle());
          oController._oQuickViewModel.setData(
            QuickViewMock.getQuickMockData(CommonConsts.QuickViewType.Contact)
          );
        } else {
          QuickViewMock.initQuckMockData(oController.getResourceBundle());
          oController._oQuickViewModel.setData(
            QuickViewMock.getQuickMockData(CommonConsts.QuickViewType.Location)
          );
        }
      },

      _getLinkControl: function (oLink) {
        if (oLink.getMetadata().getName() === 'sap.m.ObjectIdentifier') {
          return oLink.getAggregation('_titleControl');
        }
        return oLink;
      },

      _openContactQuickView: function (oLink, oQuickModel, oController) {
        let oQuickView = oController.getQuickViewControl();
        let sFragmentId = oController._oView.createId('quickViewFragment');
        if (oQuickView) {
          oQuickView.destroy();
        }
        Fragment.load({
          id: sFragmentId,
          name: 'sap.lbn.shipment.advice.view.fragments.QuickView',
          controller: oController,
        }).then((oQuickViewControl) => {
          oController._oQuickView = oQuickViewControl;
          oQuickViewControl.setBusy(true);
          this._prepareQuickViewData(oLink, oController);
          Object.getPrototypeOf(
            Object.getPrototypeOf(oController)
          ).setQuickViewControl(oQuickViewControl);
          oQuickViewControl.setModel(oQuickModel);
          oQuickViewControl.openBy(this._getLinkControl(oLink));
        });
      },

      _prepareQuickViewData: function (oSource, oController) {
        let oPromise = null;
        let sId = oSource.getId();
        if (sId.includes('customer') || sId.includes('carrier')) {
          oPromise = this._retrieveDataFromBackEnd(
            oSource,
            oController,
            CommonConsts.QuickViewType.Contact
          );
        } else {
          oPromise = this._retrieveDataFromBackEnd(
            oSource,
            oController,
            CommonConsts.QuickViewType.Location
          );
        }
        oPromise.then((oResult) => {
          oController._oQuickView.setBusy(false);
          oController._oQuickViewModel.setData(oResult.oQuickViewData);
        });
      },

      _retrieveContactLocationData: function (sContactPath, oController) {
        return new Promise((resolve, reject) => {
          const fnSuccess = (result) => {
            resolve(result);
          };
          const fnError = (error) => {
            if (error.statusCode === '404') {
              reject(error);
            }
          };
          const oDataModel = oController.getModel();
          const oParameter = {
            success: fnSuccess,
            error: fnError,
          };
          oDataModel.read(sContactPath, oParameter);
        });
      },

      _prepareContactLocationData: async function (
        oSource,
        oController,
        sType
      ) {
        let oData = null;
        let sBindingPath = oSource.getBindingContext().getPath();
        oData = oController
          .getModel()
          .getData(sBindingPath.concat(formatMessage('/{0}', [sType])));
        if (
          sType === CommonConsts.ContactType.Customer ||
          sType === CommonConsts.ContactType.Carrier
        ) {
          try {
            Object.assign(
              oData,
              await this._retrieveContactLocationData(
                sBindingPath.concat(
                  formatMessage('/{0}/ContactPerson', [sType])
                ),
                oController
              )
            );
          } catch (error) {
            Object.assign(oData, {});
          }
        } else {
          try {
            Object.assign(
              oData,
              await this._retrieveContactLocationData(
                sBindingPath.concat(
                  formatMessage('/{0}/LocationDetail', [sType])
                ),
                oController
              )
            );
          } catch (error) {
            Object.assign(oData, {});
          }
        }

        return oData;
      },

      _retrieveDataFromBackEnd: async function (oSource, oController, sType) {
        let sId = oSource.getId();
        let oResourceBundle = oController.getResourceBundle();
        let oData = null;
        let sTitle = '';
        let sPageId = '';
        let oLink = null;
        if (sType === CommonConsts.QuickViewType.Contact) {
          if (
            sId.includes('customerObject') ||
            sId.includes('customerDetailObject')
          ) {
            await this._prepareContactLocationData(
              oSource,
              oController,
              CommonConsts.ContactType.Customer
            ).then((data) => {
              oData = data;
              sPageId = 'customerInfo';
              oLink = oSource;
              sTitle = oResourceBundle.getText('CustomerContactTitile');
            });
          } else if (
            sId.includes('carrierObject') ||
            sId.includes('carrierDetailObject')
          ) {
            await this._prepareContactLocationData(
              oSource,
              oController,
              CommonConsts.ContactType.Carrier
            ).then((data) => {
              oData = data;
              sPageId = 'carrierInfo';
              oLink = oSource;
              sTitle = oResourceBundle.getText('CarrierContactTitile');
            });
          }
        }
        if (sType === CommonConsts.QuickViewType.Location) {
          if (
            sId.includes('planDepLocationTime') ||
            sId.includes('plannedDepLocObject')
          ) {
            await this._prepareContactLocationData(
              oSource,
              oController,
              'PlannedDepartureLocation'
            ).then((data) => {
              oData = data;
              sPageId = 'plannedDepLocaInfo';
              oLink = oSource;
              sTitle = oResourceBundle.getText('PlannedDepLocationTitle');
            });
          } else if (
            sId.includes('planArrivalLocationTime') ||
            sId.includes('plannedArrivalLocObject')
          ) {
            await this._prepareContactLocationData(
              oSource,
              oController,
              'PlannedArrivalLocation'
            ).then((data) => {
              oData = data;
              sPageId = 'plannedArriLocaInfo';
              oLink = oSource;
              sTitle = oResourceBundle.getText('PlannedArriLocationTitle');
            });
          }
        }
        return this._formatContactLocationData(
          sPageId,
          sTitle,
          oData,
          oLink,
          oResourceBundle,
          sType
        );
      },

      _formatContactLocationData: function (
        sPageId,
        sTitle,
        oData,
        oLink,
        oResourceBundle,
        sType
      ) {
        var oResults = {
          oQuickViewData: null,
          oLink: null,
        };
        if (sType === CommonConsts.QuickViewType.Contact) {
          oResults.oQuickViewData = {
            pages: [
              {
                pageId: sPageId,
                header: sTitle,
                groups: [
                  {
                    elements: [
                      {
                        value: oData.BpName,
                        elementType: 'text',
                      },
                      {
                        label: oResourceBundle.getText('LbnId'),
                        value: oData.LbnId,
                        elementType: 'text',
                      },
                    ],
                  },
                  {
                    heading: oResourceBundle.getText('ContactDetail'),
                    elements: [
                      {
                        label: oResourceBundle.getText('ContactName'),
                        value: oData.ContactName,
                        elementType: 'text',
                      },
                      {
                        label: oResourceBundle.getText('ContactPhone'),
                        value: oData.ContactPhone,
                        elementType: 'phone',
                      },
                      {
                        label: oResourceBundle.getText('ContactEmail'),
                        value: oData.ContactEmail,
                        elementType: 'email',
                      },
                    ],
                  },
                ],
              },
            ],
          };
          oResults.oLink = oLink;
        }
        if (sType === CommonConsts.QuickViewType.Location) {
          oResults.oQuickViewData = {
            pages: [
              {
                pageId: sPageId,
                header: sTitle,
                groups: [
                  {
                    elements: [
                      {
                        value: oData.LocationName,
                        elementType: 'text',
                      },
                      {
                        label: oResourceBundle.getText('ObjectTypeDescription'),
                        value: oData.ObjectTypeDescription,
                        elementType: 'text',
                      },
                      {
                        label: oResourceBundle.getText('SourceSystem'),
                        value: oData.SourceSystem,
                        elementType: 'text',
                      },
                      {
                        label: oResourceBundle.getText('Address'),
                        value: oData.Address,
                        elementType: 'text',
                      },
                    ],
                  },
                ],
              },
            ],
          };
          oResults.oLink = oLink;
        }

        return oResults;
      },

      onCustomerPoItemsClicked: function (oEvent, oController) {
        var oSource = oEvent.getSource();
        var oPopOverData = this._preparePOItemsPopOverData(
          oSource,
          oController
        );
        oController._oPOItemsPopModel.setData(oPopOverData);
        this._openPOItemsPopOver(
          oSource,
          oController,
          oController._oPOItemsPopModel,
          oController.getModel('i18n')
        );
      },

      _preparePOItemsPopOverData: function (oSource, oController) {
        var oDataModel = oController.getModel();
        var oBindingContext = oSource.getBindingContext();
        var sShipmentAdvicePath = oBindingContext.getPath();
        var oShipmentAdviceData = oDataModel.getData(sShipmentAdvicePath);
        var aPOItems = oShipmentAdviceData.CustomerPOItems.__list;
        var oPopOverData = {
          items: [],
        };
        aPOItems.forEach(function (item, index) {
          var sPOItemPath = '/'.concat(item);
          var oPOItemData = oDataModel.getData(sPOItemPath);
          oPopOverData.items.push(oPOItemData);
        });
        return oPopOverData;
      },

      _openPOItemsPopOver: function (
        oLink,
        oController,
        oModel,
        oResourceModel
      ) {
        var sFragmentName = 'sap.lbn.shipment.advice.view.fragments.PoItems';
        if (oController._oPOItemsPopOver) {
          oController._oPOItemsPopOver.setModel(oModel);
          oController._oPOItemsPopOver.openBy(oLink);
        } else {
          Fragment.load({
            id: 'poItemsFragment',
            name: sFragmentName,
            controller: oController,
          }).then(function (oPOItemPopOver) {
            oController._oPOItemsPopOver = oPOItemPopOver;
            oPOItemPopOver.setModel(oModel);
            oPOItemPopOver.setModel(oResourceModel, 'i18n');
            oPOItemPopOver.openBy(oLink);
          });
        }
      },

      onValueHelpClose: function (oEvent, oController) {
        var oSource = oEvent.getSource();
        oSource.close();
      },

      onValueHelpOK: function (oEvent, oController) {
        let oSource = oEvent.getSource();
        let oSelectedToken = oEvent.getParameters('tokens');
        let oToken =
          oSelectedToken && oSelectedToken.tokens && oSelectedToken.tokens[0];
        if (this._oParentController._sMode === ViewMode.Create) {
          this._checkIsCustomerChanged(
            oToken,
            this._oParentController,
            oSource
          );
        } else {
          this._storeCustomrCarrierData(
            oToken,
            this._oParentController,
            oSource
          );
        }
      },

      _checkIsCustomerChanged: function (oToken, oParentController, oSource) {
        let sId = oSource.getId();
        let oSelectValue = oToken.getCustomData()[0].getValue();
        let oPayloadModel = oParentController._oView.getModel('payload');
        let sPreCustomerLbnId = oPayloadModel.getProperty('/Customer/LbnId');
        let aSelectedPOItems = oPayloadModel.getProperty('/CustomerPOItems');
        if (sId.includes('carrier') || !sPreCustomerLbnId) {
          this._storeCustomrCarrierData(oToken, oParentController, oSource);
          return true;
        }
        const fnHandlMessageOk = function (oAction) {
          if (oAction === MessageBox.Action.OK) {
            oPayloadModel.setProperty('/CustomerPOItems', []);
            this._storeCustomrCarrierData(oToken, oParentController, oSource);
          } else {
            oSource.close();
          }
        };

        if (
          sPreCustomerLbnId !== oSelectValue.LbnId &&
          aSelectedPOItems.length !== 0
        ) {
          MessageBox.warning(
            oParentController
              .getResourceBundle()
              .getText('customerIsChanged', [
                sPreCustomerLbnId,
                oSelectValue.LbnId,
              ]),
            {
              onClose: fnHandlMessageOk.bind(this),
              actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
              emphasizedAction: MessageBox.Action.OK,
              initialFocus: MessageBox.Action.CANCEL,
              textDirection: sap.ui.core.TextDirection.Inherit,
            }
          );
        } else {
          this._storeCustomrCarrierData(oToken, oParentController, oSource);
        }
      },

      _storeCustomrCarrierData: function (oToken, oParentController, oSource) {
        let oSelectRow = oToken.getCustomData()[0];
        let oSelectValue = oSelectRow.getValue();
        let oPayloadModel = oParentController._oView.getModel('payload');
        let oPayload = {
          LbnId: oSelectValue.LbnId,
          BpName: oSelectValue.BpName,
          BpType: oSelectValue.BpType,
          TenantId: oSelectValue.TenantId,
          ContactPerson_Id: oSelectValue.ContactPerson_Id,
        };
        let sId = oSource.getId();
        let oParent = oSource.getParent();
        let sDisplayText = oToken.getText();
        if (sId.includes('customer')) {
          oPayloadModel.setProperty('/Customer/', oPayload);
          oParent.byId('customerInput').setValue(sDisplayText);
        } else {
          oParent.byId('carrierInput').setValue(sDisplayText);
          oPayloadModel.setProperty('/Carrier/', oPayload);
        }
        oSource.close();
      },

      onValueHelpSearch: function (oEvent, oController) {
        var oSource = oEvent.getSource();
        var sId = oSource.getId();
        var bIsCustomer = sId.includes('customer');
        var aSelectionSet = oEvent.getParameters('selectionSet').selectionSet;
        var sBasicSearchValue = oSource.getBasicSearchValue();

        var aFilters = aSelectionSet.reduce(function (aResult, oControl) {
          if (oControl.getValue()) {
            aResult.push(
              new Filter({
                path: oControl.getName(),
                operator: FilterOperator.Contains,
                value1: oControl.getValue(),
              })
            );
          }
          return aResult;
        }, []);

        if (sBasicSearchValue !== '') {
          aFilters.push(
            new Filter({
              filters: [
                new Filter({
                  path: 'LbnId',
                  operator: FilterOperator.Contains,
                  value1: sBasicSearchValue,
                }),
                new Filter({
                  path: 'BpName',
                  operator: FilterOperator.Contains,
                  value1: sBasicSearchValue,
                }),
              ],
              and: false,
            })
          );
        }

        this._filterTable(
          new Filter({
            filters: aFilters,
            and: true,
          }),
          bIsCustomer
        );
      },

      _filterTable: function (oFilter, bIsCustomer) {
        var oValueHelpDialog = null;
        if (bIsCustomer) {
          oValueHelpDialog = this._oParentController._oCustomerDialog;
        } else {
          oValueHelpDialog = this._oParentController._oCarrierDialog;
        }

        oValueHelpDialog.getTableAsync().then(function (oTable) {
          if (oTable.bindRows) {
            oTable.getBinding('rows').filter(oFilter);
          }

          if (oTable.bindItems) {
            oTable.getBinding('items').filter(oFilter);
          }

          oValueHelpDialog.update();
        });
      },

      _prepareLocalColModel: function () {
        let oResourceBundle = this._oParentController.getResourceBundle();
        let aCols = {
          cols: [
            {
              label: oResourceBundle.getText('ExternalIdColTitle'),
              template: 'view>LocationDetail/ExternalId',
            },
            {
              label: oResourceBundle.getText('LocaDesColTitle'),
              template: 'view>LocationName',
            },
            {
              label: oResourceBundle.getText('Address'),
              template: 'view>LocationDetail/Address',
            },
            {
              label: oResourceBundle.getText('LocaAltKey'),
              template: 'view>LocationAltkey',
            },
          ],
        };
        let oColModel = new JSONModel(aCols);
        return {
          aCols: aCols,
          oColModel: oColModel,
        };
      },

      onLocationValueHelpClose: function (oEvent, oController) {
        var oSource = oEvent.getSource();
        oSource.close();
      },

      onLocationValueHelpSearch: function (oEvent, oController) {
        let oSource = oEvent.getSource();
        let aSelectionSet = oEvent.getParameters('selectionSet').selectionSet;
        let sBasicSearchValue = oSource.getBasicSearchValue();
        let oLocaValueHelpDialog = this._oParentController._oLocationDialog;

        let aFilters = aSelectionSet.reduce(function (aResult, oControl) {
          if (oControl.getValue()) {
            aResult.push(
              new Filter({
                path: oControl.getName(),
                operator: FilterOperator.Contains,
                value1: oControl.getValue(),
              })
            );
          }
          return aResult;
        }, []);

        if (sBasicSearchValue !== '') {
          aFilters.push(
            new Filter({
              filters: [
                new Filter({
                  path: 'LocationDetail/ExternalId',
                  operator: FilterOperator.Contains,
                  value1: sBasicSearchValue,
                }),
                new Filter({
                  path: 'LocationName',
                  operator: FilterOperator.Contains,
                  value1: sBasicSearchValue,
                }),
                new Filter({
                  path: 'LocationAltkey',
                  operator: FilterOperator.Contains,
                  value1: sBasicSearchValue,
                }),
              ],
              and: false,
            })
          );
        }
        let oFilter = new Filter({
          filters: aFilters,
          and: true,
        });

        if (oLocaValueHelpDialog) {
          oLocaValueHelpDialog.getTableAsync().then(function (oTable) {
            if (oTable.bindRows) {
              oTable.getBinding('rows').filter(oFilter);
            }

            if (oTable.bindItems) {
              oTable.getBinding('items').filter(oFilter);
            }
            oLocaValueHelpDialog.update();
          });
        }
      },

      onLocationValueHelpOK: function (oEvent, oController) {
        let oSource = oEvent.getSource();
        let oSelectedToken = oEvent.getParameters('tokens');
        let oToken =
          oSelectedToken && oSelectedToken.tokens && oSelectedToken.tokens[0];
        let oParentView = oSource.getParent();
        let oParentController = oParentView.getController();
        let sLocaltionInputId = '';
        let bIsDeparture = true;

        if (oParentController._oLocationInput) {
          sLocaltionInputId = oParentController._oLocationInput.getId();
          if (sLocaltionInputId.includes('planAriLocaInput')) {
            bIsDeparture = false;
          }
        }

        this._storeLocationData(oToken, this._oParentController, bIsDeparture);
        oSource.close();
      },

      _storeLocationData: function (oToken, oParentController, bIsDeparture) {
        let oSelectRow = oToken.getCustomData()[0];
        let oSelectValue = oSelectRow.getValue();
        var oPayloadModel = oParentController._oView.getModel('payload');
        var oPayload = {
          Id: oSelectValue.Id,
          TenantId: oSelectValue.TenantId,
          LocationName: oSelectValue.LocationName,
          LocationAltkey: oSelectValue.LocationAltkey,
          LocationDetail: {
            Id: oSelectValue.LocationDetail.Id,
            ObjectTypeDescription:
              oSelectValue.LocationDetail.ObjectTypeDescription,
            SourceSystem: oSelectValue.LocationDetail.SourceSystem,
            ExternalId: oSelectValue.LocationDetail.ExternalId,
            Address: oSelectValue.LocationDetail.Address,
          },
        };
        if (bIsDeparture) {
          oPayloadModel.setProperty('/PlannedDepartureLocation/', oPayload);
        } else {
          oPayloadModel.setProperty('/PlannedArrivalLocation/', oPayload);
        }
      },

      onLocaValueRequest: function (oEvent, oController) {
        let oSource = oEvent.getSource();
        let sFragmentName =
          'sap.lbn.shipment.advice.view.fragments.LocationValueHelpDialog';
        this._oParentController = oController;
        if (oController._oLocationDialog) {
          oController._oLocationDialog.destroy();
        }
        Fragment.load({
          name: sFragmentName,
          controller: this,
        }).then((oDialog) => {
          let oFilterBar = oDialog.getFilterBar();
          oController._oLocationInput = oSource;
          oController._oLocationDialog = oDialog;
          oController._oView.addDependent(oDialog);
          oController._oLocaBasicSearchField = new SearchField({
            showSearchButton: false,
          });
          oFilterBar.setFilterBarExpanded(false);
          oFilterBar.setBasicSearch(oController._oLocaBasicSearchField);
          this._retrieveLocationData(oDialog, oController);
          oDialog.setBusy(true);
          oDialog.open();
        });
      },

      _retrieveLocationData: function (oDialog, oController) {
        let sPath = '/LocationMaster';
        let oDataModel = this._oParentController.getModel();
        let oParentView = this._oParentController._oView;
        let sBindingPath = 'view>/locationList';
        let oColObject = this._prepareLocalColModel();
        let sTenantId =
          oController._oPayloadModel.getProperty('/Customer/TenantId');
        const fnSuccess = function (oData) {
          oParentView
            .getModel('view')
            .setProperty('/locationList', oData.results);
          oDialog.setBusy(false);

          oDialog.getTableAsync().then(function (oTable) {
            oTable.setModel(oParentView.getModel('view'));
            oTable.setModel(oColObject.oColModel, 'columns');

            if (oTable.bindRows) {
              oTable.bindAggregation('rows', sBindingPath);
            }

            if (oTable.bindItems) {
              oTable.bindAggregation('items', sBindingPath, function () {
                return new ColumnListItem({
                  cells: oColObject.aCols.map(function (column) {
                    return new Label({
                      text: `{view>${column.template}}`,
                    });
                  }),
                });
              });
            }
          });

          oDialog.open();
        };
        const fnError = function (oError) {
          oDialog.setBusy(false);
          let oResponse = oError.responseText;
          if (oResponse) {
            MessageBox.error(Common.getValidErrorJSONParse(oResponse));
          }
        };

        let aFilters = [
          new Filter({
            path: 'TenantId',
            operator: FilterOperator.EQ,
            value1: sTenantId,
          }),
        ];
        let aSorters = [
          new Sorter({
            path: 'LocationDetail/ExternalId',
          }),
          new Sorter({
            path: 'LocationAltkey',
          }),
        ];

        let oParameter = {
          urlParameters: {
            $expand: 'LocationDetail',
          },
          filters: aFilters,
          sorters: aSorters,
          success: fnSuccess.bind(this),
          error: fnError.bind(this),
        };

        oDataModel.read(sPath, oParameter);
      },

      _prepareColModel: function (bIsCustomer) {
        const oResourceBundle = this._oParentController.getResourceBundle();
        let aCols = {};
        if (bIsCustomer) {
          aCols = {
            cols: [
              {
                label: oResourceBundle.getText('lbnIdColTitle'),
                template: 'view>LbnId',
              },
              {
                label: oResourceBundle.getText('bpNameColTitle'),
                template: 'view>BpName',
              },
              {
                label: oResourceBundle.getText('ContactName'),
                template: 'view>ContactPerson/ContactName',
              },
              {
                label: oResourceBundle.getText('ContactEmail'),
                template: 'view>ContactPerson/ContactEmail',
              },
              {
                label: oResourceBundle.getText('ContactPhone'),
                template: 'view>ContactPerson/ContactPhone',
              },
            ],
          };
        } else {
          aCols = {
            cols: [
              {
                label: oResourceBundle.getText('lbnIdColTitle'),
                template: 'LbnId',
              },
              {
                label: oResourceBundle.getText('bpNameColTitle'),
                template: 'BpName',
              },
              {
                label: oResourceBundle.getText('ContactName'),
                template: 'ContactPerson/ContactName',
              },
              {
                label: oResourceBundle.getText('ContactEmail'),
                template: 'ContactPerson/ContactEmail',
              },
              {
                label: oResourceBundle.getText('ContactPhone'),
                template: 'ContactPerson/ContactPhone',
              },
            ],
          };
        }
        var oColModel = new JSONModel(aCols);

        return {
          aCols: aCols,
          oColModel: oColModel,
        };
      },

      // To retrieve customer via no pagination or lazy loading
      _retrieveCustomerData: function (sBpType, oDialog, oColObject) {
        let sPath = '/Party';
        let aFilters = [];
        let oDataModel = this._oParentController.getModel();
        let oParentView = this._oParentController._oView;
        let sBindingPath = null;
        const fnSuccess = function (oData) {
          oDialog.setBusy(false);
          oParentView
            .getModel('view')
            .setProperty('/customerList', oData.results);
          sBindingPath = 'view>/customerList';
          oDialog.getTableAsync().then(
            function (oTable) {
              oTable.setModel(oParentView.getModel('view'));
              oTable.setModel(oColObject.oColModel, 'columns');

              if (oTable.bindRows) {
                oTable.bindAggregation('rows', sBindingPath);
              }
              this._oParentController._oCustomerDialog = oDialog;
              this._oParentController._oCustomerDialog.update();
            }.bind(this)
          );
        };
        const fnError = function (oError) {
          oDialog.setBusy(false);
        };
        let oBpTypeFilter = new Filter({
          path: 'BpType',
          operator: FilterOperator.EQ,
          value1: sBpType,
        });

        aFilters.push(oBpTypeFilter);
        let oParameter = {
          urlParameters: {
            $expand: 'ContactPerson',
          },
          filters: aFilters,
          success: fnSuccess.bind(this),
          error: fnError.bind(this),
        };
        oDataModel.read(sPath, oParameter);
      },

      // To retrieve carrier data via lazy loading or pagination
      _retrieveCarrierData: function (sBpType, oDialog, oColObject) {
        let sPath = '/Party';
        let oDataModel = this._oParentController.getModel();
        let aFilters = [];
        let oBpTypeFilter = new Filter({
          path: 'BpType',
          operator: FilterOperator.EQ,
          value1: sBpType,
        });
        aFilters.push(oBpTypeFilter);
        let oBindingInfo = {
          path: sPath,
          filters: aFilters,
          parameters: {
            expand: 'ContactPerson',
          },
        };
        const fnRowsUpdated = (oEvent) => {
          oDialog.setBusy(false);
        };
        oDialog.getTableAsync().then(
          function (oTable) {
            oTable.setModel(oDataModel);
            oTable.setModel(oColObject.oColModel, 'columns');
            if (oTable.bindRows) {
              oTable.setVisibleRowCountMode(
                sap.ui.table.VisibleRowCountMode.Auto
              );
              oTable.setThreshold(20);
              oTable.bindAggregation('rows', oBindingInfo, function () {
                return new Row({
                  cells: oColObject.aCols.map(function (column) {
                    return new Label({
                      text: `{${column.template}}`,
                    });
                  }),
                });
              });
              oTable.attachRowsUpdated(fnRowsUpdated);
            }

            this._oParentController._oCarrierDialog = oDialog;
            this._oParentController._oCarrierDialog.update();
          }.bind(this)
        );
      },

      _preparePartyData: function (sBpType, oDialog, bIsCustomer) {
        let oColObject = this._prepareColModel(bIsCustomer);
        if (bIsCustomer) {
          this._retrieveCustomerData(sBpType, oDialog, oColObject);
        } else {
          this._retrieveCarrierData(sBpType, oDialog, oColObject);
        }
      },

      onValueHelpRequest: function (oEvent, oController) {
        let oSource = oEvent.getSource();
        let sInputValue = oSource.getValue();
        let sFragmentId = '';
        let sFragmentName = '';
        let bIsCustomer = '';
        let sId = oSource.getId();
        let that = this;
        this._oParentController = oController;
        if (sId.includes('customer')) {
          bIsCustomer = true;
          sFragmentId = oController._oView.createId('customerVH');
          sFragmentName =
            'sap.lbn.shipment.advice.view.fragments.CustomerValueHelpDialog';
          if (oController._oCustomerDialog) {
            oController._oCustomerDialog.destroy();
          }
        } else {
          sFragmentId = oController._oView.createId('carrierVH');
          sFragmentName =
            'sap.lbn.shipment.advice.view.fragments.CarrierValueHelpDialog';
          if (oController._oCarrierDialog) {
            oController._oCarrierDialog.destroy();
          }
        }
        Fragment.load({
          id: sFragmentId,
          name: sFragmentName,
          controller: this,
        }).then(function (oDialog) {
          let oFilterBar = oDialog.getFilterBar();
          oDialog.getTableAsync().then(function (oTable) {
            oTable.setNoData(oController.getResourceBundle().getText('noData'));
          });
          oController._oBasicSearchField = new SearchField({
            showSearchButton: false,
          });
          oController._oView.addDependent(oDialog);
          oFilterBar.setFilterBarExpanded(false);
          oFilterBar.setBasicSearch(oController._oBasicSearchField);
          if (bIsCustomer === true) {
            oController._oCustomerDialog = oDialog;
            that._preparePartyData('GTT_SOLUTION_OWNER', oDialog, bIsCustomer);
          } else {
            oController._oCarrierDialog = oDialog;
            that._preparePartyData('CARRIER', oDialog, bIsCustomer);
          }
          oDialog.setBusy(true);
          oDialog.open(sInputValue);
        });
      },
    };
    return oHandler;
  }
);
