'use strict';
sap.ui.define(['./CommonConsts'], function (Common) {
  let oQuickViewMock = {
    Contact: {},
    Location: {},
    initQuckMockData: function (oResourceBundle) {
      this.Contact = {
        pages: [
          {
            header: oResourceBundle.getText('noData'),
            groups: [
              {
                elements: [
                  {
                    value: oResourceBundle.getText('noData'),
                    elementType: 'text',
                  },
                  {
                    label: oResourceBundle.getText('LbnId'),
                    value: oResourceBundle.getText('noData'),
                    elementType: 'text',
                  },
                ],
              },
              {
                heading: oResourceBundle.getText('ContactDetail'),
                elements: [
                  {
                    label: oResourceBundle.getText('ContactName'),
                    value: oResourceBundle.getText('noData'),
                    elementType: 'text',
                  },
                  {
                    label: oResourceBundle.getText('ContactPhone'),
                    value: oResourceBundle.getText('noData'),
                    elementType: 'phone',
                  },
                  {
                    label: oResourceBundle.getText('ContactEmail'),
                    value: oResourceBundle.getText('noData'),
                    elementType: 'email',
                  },
                ],
              },
            ],
          },
        ],
      };
      this.Location = {
        pages: [
          {
            header: oResourceBundle.getText('noData'),
            groups: [
              {
                elements: [
                  {
                    value: oResourceBundle.getText('noData'),
                    elementType: 'text',
                  },
                  {
                    label: oResourceBundle.getText('ObjectTypeDescription'),
                    value: oResourceBundle.getText('noData'),
                    elementType: 'text',
                  },
                  {
                    label: oResourceBundle.getText('SourceSystem'),
                    value: oResourceBundle.getText('noData'),
                    elementType: 'text',
                  },
                  {
                    label: oResourceBundle.getText('Address'),
                    value: oResourceBundle.getText('noData'),
                    elementType: 'text',
                  },
                ],
              },
            ],
          },
        ],
      };
    },
    getQuickMockData: function (sQuickViewType) {
      if (sQuickViewType === Common.QuickViewType.Contact) {
        return this.Contact;
      }
      return this.Location;
    },
  };

  return oQuickViewMock;
});
