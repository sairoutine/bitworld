'use strict';
var glmat = require("gl-matrix");
var worldV = require("./shader/world.vs");
var worldF = require("./shader/world.fs");
var billboardV = require("./shader/billboard.vs");
var depthV = require("./shader/depth.vs");
var depthF = require("./shader/depth.fs");

/** Returns compiled shader */
var getShader = function(gl, type, text) {
	var shader = gl.createShader(type);
	gl.shaderSource(shader, text);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		throw (type == gl.VERTEX_SHADER ? "Vertex" : "Fragment")
			+ " failed to compile:\n\n" 
			+ gl.getShaderInfoLog(shader);
	}

	return shader;
};

/** Assigns shaders to program and returns the program */
var initShader = function(gl, vertexShaderText, fragmentShaderText) {
	var shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, getShader(gl, gl.VERTEX_SHADER, vertexShaderText));
	gl.attachShader(shaderProgram, getShader(gl, gl.FRAGMENT_SHADER, fragmentShaderText));
	gl.linkProgram(shaderProgram);

	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) 
		throw new Error("Could not initialize shaders");

	return shaderProgram;
}

var newProgram = function(gl, vs, fs, att, uni, mats) {
	var glProgram = initShader(gl, vs,fs);
	var p = {
		program: glProgram,
		a: {},
		u: {},
		m: {}
	};
	// Set attributes
	for (var i=0; i<att.length; i++) 
		p.a[att[i]] = gl.getAttribLocation(glProgram, "a"+att[i]);

	// Set uniforms
	for (var i=0; i<uni.length; i++) 
		p.u[uni[i]] = gl.getUniformLocation(glProgram, "u"+uni[i]);

	// Initialize matrices
	for (var prop in mats) {
		var size = mats[prop];
		var mat;
		switch(size) {
		case 2: mat = glmat.mat2; break;
		case 3: mat = glmat.mat3; break;
		case 4: mat = glmat.mat4; break;
		default: console.log("Invalid matrix size");
		}
		p.m[prop] = mat.create();
		mat.identity(p.m[prop]);
	}
	return p;
};



var programs = function (gl) {
	return {
		world: newProgram(
			gl,
			worldV, worldF, 
			[
				"Position", 
				"Texture", 
				"Normal"
			],
			[
				"PMatrix", 
				"MMatrix", 
				"VMatrix", 
				"Sampler", 
				"LightVMatrix", 
				"LightPMatrix", 
				"AmbientColor", 
				"DepthMap", 
				"Light"
			],
			{
				pMatrix: 4,
				mMatrix: 4,
				vMatrix: 4
			}
		),
		sprites: newProgram(
			gl,
			billboardV, worldF, 
			[
				"Position", 
				"Offset",
				"Texture",
				"Moving",
				"Flipped"
			],
			[
				"Counter", 
				"CamPos", 
				"PMatrix", 
				"MMatrix", 
				"VMatrix", 
				"Sampler", 
				"AmbientColor", 
				"DepthMap", 
				"Light"
			],
			{}
		),
		depth: newProgram(
			gl,
			depthV, depthF,
			[
				"Position"
			],
			[
				"PMatrix", 
				"NMatrix", 
				"MMatrix", 
			],
			{
				pMatrix: 4,
				mMatrix: 4,
				vMatrix: 4
			}
		)
	};
};
module.exports = programs;
