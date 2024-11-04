/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"ivy/ui_computer_request_app_ivy/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
