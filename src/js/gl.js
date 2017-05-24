'use strict';

var WebGLDebugUtils = require("webgl-debug");

var createWebGLContext = function (canvas) {
	var gl;
	try {
		gl = WebGLDebugUtils.makeDebugContext(canvas.getContext("experimental-webgl"));
	} catch (e) {
		window.alert(e);
	}
	if (!gl) 
		window.alert("Could not initialize WebGL");

	return gl;
};

module.exports = createWebGLContext;
