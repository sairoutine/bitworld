'use strict';
var glmat = require("gl-matrix");
var PointLight = require("./point_light");
var worldV = require("./shader/world.vs");
var worldF = require("./shader/world.fs");
var billboardV = require("./shader/billboard.vs");

/** Returns compiled shader */
var getShader = function(gl, type, text) {
	// 01. シェーダ作成
	var shader = gl.createShader(type);

	// 02. 生成されたシェーダにソースを割り当てる
	gl.shaderSource(shader, text);

	// 03. シェーダをコンパイルする
	gl.compileShader(shader);

	// 04. シェーダが正しくコンパイルされたかチェック
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		throw (
			(type === gl.VERTEX_SHADER ? "Vertex" : "Fragment") + " failed to compile:\n\n" + gl.getShaderInfoLog(shader));
	}

	return shader;
};


// プログラムオブジェクト(頂点シェーダ->フラグメントシェーダのデータの受け渡し)の作成
/** Assigns shaders to program and returns the program */
var initShader = function(gl, vertexShaderText, fragmentShaderText) {
	// シェーダのコンパイル
	var vertexShader   = getShader(gl, gl.VERTEX_SHADER, vertexShaderText);
	var fragmentShader = getShader(gl, gl.FRAGMENT_SHADER, fragmentShaderText);

	// 05. プログラムオブジェクトの生成
	var shaderProgram = gl.createProgram();

	// 06. プログラムオブジェクトにシェーダを割り当てる
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);

	// 07. シェーダをリンク
	gl.linkProgram(shaderProgram);

	// 08. シェーダのリンクが正しく行なわれたかチェック
	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		throw new Error("Could not initialize shaders:\n\n" + gl.getProgramInfoLog(shaderProgram));
	}

	return shaderProgram;
};

var newProgram = function(gl, vs, fs, att, uni, mats) {
	var glProgram = initShader(gl, vs,fs);
	var p = {
		program: glProgram,
		a: {},
		u: {},
		m: {}
	};

	var i;
	// Set attributes
	for (i=0; i<att.length; i++) 
		p.a[att[i]] = gl.getAttribLocation(glProgram, "a"+att[i]);

	// Set uniforms
	for (i=0; i<uni.length; i++) 
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
	};
};


var CreateData = function(gl){
		var data = programs(gl);

		// Uniform array of PointLight structs in GLSL
		setLightUniforms(gl, data.world);
		setLightUniforms(gl, data.sprites);

		// 背景色
		//data.background = [0.5, 0.5, 0.5, 1.0];
		data.background = [0, 0, 0, 1]; // 黒
		data.rotateSpeed = 0.01;
		data.zoomFactor = 0.01;
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
