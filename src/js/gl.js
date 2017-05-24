'use strict';

var WebGLDebugUtils = require("webgl-debug");

var createWebGLContext = function (canvas) {
	//  rewrite canvas dom
	canvas = document.createElement('canvas');
	var gl;
	try {
		gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
		gl = WebGLDebugUtils.makeDebugContext(gl);
	} catch (e) {
		window.alert(e);
	}
	if (!gl) {
		window.alert("Could not initialize WebGL");
	}

	return gl;
};

module.exports = createWebGLContext;
