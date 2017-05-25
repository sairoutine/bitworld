'use strict';
var programs = require("./programs");
var PointLight = require("./point_light");
var CreateData = function(gl){
		var data = programs(gl);

		// Uniform array of PointLight structs in GLSL
		setLightUniforms(gl, data.world);
		setLightUniforms(gl, data.sprites);

		//data.background = [0.5, 0.5, 0.5, 1.0];
		data.background = [0, 0, 0, 1];
		data.rotateSpeed = 0.01;
		data.zoomFactor = 0.01;

		gl.enable(gl.DEPTH_TEST);

		gl.useProgram(data.world.program);
		return data;
};
function setLightUniforms(gl, prog) {
	// Uniform array of PointLight structs in GLSL
	prog.u.Light = [];
	for (var i=0; i<4; i++) {
		var l = prog.u.Light;
		l[i] = {};
		for (var key in new PointLight()) {
			l[i][key] = gl.getUniformLocation(prog.program, "uLight["+i+"]."+key);
		}
	}
}
module.exports = CreateData;
