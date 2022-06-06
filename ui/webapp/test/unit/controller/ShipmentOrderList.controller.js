/*global QUnit*/

sap.ui.define([
	"ui/controller/ShipmentOrderList.controller"
], function (Controller) {
	"use strict";

	QUnit.module("ShipmentOrderList Controller");

	QUnit.test("I should test the ShipmentOrderList controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
